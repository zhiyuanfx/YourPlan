/**
 * Zhiyuan Jia & Yuekai Xu
 * 10/28/2023
 * Section: CSE 154 AF
 * TA: Rasmus Makiniemi
 *
 * This JavaScript file is designed for the YourPlan course enrollment website.
 * It adds click event listeners to buttons on the page,
 * allowing users to navigate to different sections of the website when the buttons are clicked.
 */

'use strict';
(function() {
  window.addEventListener('load', init);

  /**
   * Initializes the click event listeners for various navigation links on the web page.
   * When a link is clicked, it redirects the user to the corresponding page.
   */
  function init() {
    document.getElementById('main-page').addEventListener('click', function() {
      window.location.href = '../index.html';
    });

    document.getElementById('cart-button').addEventListener('click', function() {
      window.location.href = '../cartpage/cart.html';
    });

    document.getElementById('history').addEventListener('click', function() {
      window.location.href = '../history/history.html';
    });

    document.getElementById('logout').addEventListener('click', function() {
      logOut();
    });

    fetchCourse('CSE', true);

    document.getElementById('major-and-minor').addEventListener('change', function() {
      let major = document.getElementById('major-and-minor').value;
      let isMajor = true;
      if (major.slice(-2) === '-M') {
        major = major.split('-')[0];
        isMajor = false;
      }
      fetchCourse(major, isMajor);
    });
  }

  /**
   * change the login button to log out.
   */
  function logOut() {
    let netid = localStorage.getItem('netid');
    fetch('/yourplan/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({netid: netid})
    })
      .then(statusCheck)
      .then(response => response.json())
      .then(window.location.href = '../loginpage/login.html')
      .catch(handleError);
  }

  /**
   * Fetches course information based on the selected major or minor and updates the UI.
   * @param {String} major - The selected major/minor.
   * @param {boolean} isMajor - Boolean indicating if the selection is a major or minor.
   */
  async function fetchCourse(major, isMajor) {
    let sign = await checksignin();
    if (!sign) {
      window.location.href = "../loginpage/login.html";
    } else {
      let netid = localStorage.getItem('netid');
      let url = `/yourplan/degreeaudit/${netid}/${major}/${isMajor}`;
      fetch(url)
        .then(statusCheck)
        .then(response => response.json())
        .then(data => {
          displayAudit(data);
        })
        .catch(handleError);
    }
  }

  /**
   * Displays the degree audit information on the page by updating relevant UI elements.
   * @param {Object} data - Data containing degree audit details.
   */
  function displayAudit(data) {
    document.getElementById('name').textContent = data['full_name'];
    document.getElementById('id').textContent = data['netid'];
    document.getElementById('earned').textContent = data['creditEarned'];
    document.getElementById('needed').textContent = data['creditNeeded'];

    let needed = document.getElementById('audit-table');
    needed.innerHTML = '';
    needed.appendChild(tableTitle(false));
    data.stillNeeded.forEach(course => {
      needed.appendChild(coursesAdded(course, ''));
    });

    let finished = document.getElementById('audit-table-pass');
    finished.innerHTML = '';
    finished.appendChild(tableTitle(true));
    data.finished.forEach(course => {
      finished.appendChild(coursesAdded(course, 'Passed'));
    });

    let inProgress = document.getElementById('audit-table-in-progress');
    inProgress.innerHTML = '';
    inProgress.appendChild(tableTitle(true));
    data.inProgress.forEach(course => {
      inProgress.appendChild(coursesAdded(course, 'In Progress'));
    });

    let failed = document.getElementById('audit-table-failed');
    failed.innerHTML = '';
    failed.appendChild(tableTitle(true));
    data.failed.forEach(course => {
      failed.appendChild(coursesAdded(course, 'Failed'));
    });
  }

  /**
   * Generates a table row for the title of a course table.
   * @param {boolean} status - Indicates if the table should include a 'status' column.
   * @returns {HTMLElement} - A table row element with headers for course information.
   */
  function tableTitle(status) {
    let tr = document.createElement('tr');
    let course = document.createElement('th');
    course.textContent = 'Course Name';

    let descript = document.createElement('th');
    descript.textContent = 'Course Title';

    let credit = document.createElement('th');
    credit.textContent = 'Credit';

    tr.appendChild(course);
    tr.appendChild(descript);
    tr.appendChild(credit);

    if (status) {
      let statusTh = document.createElement('th');
      statusTh.textContent = 'Status';

      tr.appendChild(statusTh);
    }
    return tr;
  }

  /**
   * Creates a table row for a course, including its name, description, credit, and status.
   * @param {Object} course - Course object containing course details.
   * @param {String} status - The status of the course (e.g., 'Passed', 'Failed', 'In Progress').
   * @returns {HTHTMLElementML} - A table row element populated with course information.
   */
  function coursesAdded(course, status) {
    let tr = document.createElement('tr');
    let courseTd = document.createElement('td');
    courseTd.textContent = course.courseName;

    let descriptTd = document.createElement('td');
    descriptTd.textContent = course.title;

    let creditTd = document.createElement('td');
    creditTd.textContent = course.credit;

    tr.appendChild(courseTd);
    tr.appendChild(descriptTd);
    tr.appendChild(creditTd);

    if (status) {
      let statusTd = document.createElement('td');
      statusTd.textContent = status;
      let statusText = '';
      if (status === 'Passed') {
        statusText = 'course-status-passed';
      } else if (status === 'In Progress') {
        statusText = 'course-status-in-progress';
      } else {
        statusText = 'course-status-failed';
      }
      statusTd.className = statusText;

      tr.appendChild(statusTd);
    }
    return tr;
  }

  /**
   * Checks the response status and throws an error if it's not a successful response (non-OK).
   * @async
   * @param {Response} response - The network response to check.
   * @returns {Response} - The response if it's successful.
   * @throws {Error} If the network response is not successful (non-OK).
   */
  async function statusCheck(response) {
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response;
  }

  /**
   * Handles errors by displaying an error message in the specified container.
   *
   * @param {string} error - The error message to display.
   */
  function handleError(error) {
    window.location.href = '../errorpage/error.html';
    if (!error.message.startsWith('<!DOCTYPE html>')) {
      localStorage.setItem('error', error.message);
    } else {
      localStorage.setItem('error', 'Error: Unknown error');
    }
  }

  /**
   * Returns whether or not the current user is already signed in using the
   * yourplan api. Checks the status of the api response, and displays a warning
   * message if an error occured.
   * @returns {boolean} True if already signed in, false otherwise.
   */
  async function checksignin() {
    try {
      const response = await fetch("/yourplan/checksignin/" + localStorage.getItem('netid'));
      await statusCheck(response);
      let res = await response.json();
      return res.isAlreadySignedIn;
    } catch (error) {
      handleError(error);
    }
  }
})();