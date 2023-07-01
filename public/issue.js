'use strict';

let fetchedIssues;
let projectTitle;
let viewedIssue;

// configure jquery ajax to show request responses and errors in toasts
$.ajaxSetup({
  success: (res) => {
    const toastEl = $('#AJAXResultToast');
    toastEl
      .addClass('text-bg-success')
      .find('.toast-body')
      .text(res.result ? res.result : 'request completed successfully');
    bootstrap.Toast.getOrCreateInstance(toastEl).show();
  },
  error: (err) => {
    const toastEl = $('#AJAXResultToast');
    toastEl
      .addClass('text-bg-danger')
      .find('.toast-body')
      .text(err.responseJSON.error);
    bootstrap.Toast.getOrCreateInstance(toastEl).show();
  },
});

$(document).ready(function () {
  projectTitle = getProjectTitle();
  setProjectTitle(projectTitle);
  $.ajax({
    url: `/api/issues/${projectTitle}`,
    success: function (result) {
      $('#loadingSpinner').remove();
      fetchedIssues = result;
      renderIssues(result);
    },
  });
});

function getProjectTitle() {
  return window.location.pathname.split('/')[1];
}

function setProjectTitle(projectTitle) {
  $('#projectTitle').text(`${projectTitle} project`);
}

function renderIssues(issues) {
  if (issues.length === 0) {
    $('#issueEmptyListTemplate').removeClass('d-none');
  } else {
    $('#issueTable')
      .removeClass('d-none')
      .find('tbody')
      .html(
        issues.map(
          (issue, i) => `<tr>
          <th>${i + 1}</th>
    <td>${issue._id}</td>
    <td>${issue.issue_title}</td>
    <td>${issue.created_by}</td>
    <td>${issue.open ? 'open' : 'closed'}</td>
    <td><button class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#modifyIssueModal" data-issueIdx="${i}">View</button></td>
    </tr>`
        )
      );
  }
}

$('#createIssueModal')
  .find('form')
  .on('submit', function (e) {
    e.preventDefault();
    const formData = extractFormDataAsJSON($(this));
    $.ajax({
      url: `/api/issues/${projectTitle}`,
      method: 'POST',
      data: formData,
    });
  });

$('#modifyIssueModal')
  .on('show.bs.modal', function (e) {
    const viewedIssueIdx = e.relatedTarget.getAttribute('data-issueIdx');
    viewedIssue = fetchedIssues[viewedIssueIdx];
    for (let formControl of Array.from(
      $(this).find('form :not([type="hidden"])[name]')
    )) {
      const issueField = viewedIssue[formControl.getAttribute('name')];
      if (formControl.getAttribute('type') === 'checkbox') {
        formControl.checked = issueField;
      } else {
        formControl.value = issueField;
      }
    }
  })
  .find('form')
  .on('submit', function (e) {
    e.preventDefault();
    const formData = extractFormDataAsJSON($(this));
    $.ajax({
      url: `/api/issues/${projectTitle}`,
      method: 'PUT',
      data: formData,
    });
  });

// since jquery form element wrapper doesn't have a method to get form data
// as JSON this method help us about this
function extractFormDataAsJSON(jqueryFormEl) {
  const data = {};
  jqueryFormEl.serializeArray().forEach((el) => {
    data[el.name] = el.value;
  });
  return data;
}

$('#deleteIssueBtn').on('click', function () {
  confirm('are you sure?')
    ? $.ajax({
        url: `/api/issues/${projectTitle}`,
        method: 'DELETE',
        data: {
          _id: viewedIssue._id,
        },
      })
    : '';
});