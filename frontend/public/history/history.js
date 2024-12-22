/*
 * Name: Zhiyuan Jia & Yuekai Xu
 * Date: 10/28/2023
 * Section: CSE 154 AF
 * TA: Rasmus
 * This is the JS to implement the UI for our history.html page. It allows the user to
 * view the courses already taken and navigate through the main pages of the website.
 */

'use strict';
(function() {
  window.addEventListener('load', init);

  /** Initializes the web page. */
  function init() {

    id('main-page').addEventListener('click', function() {
      window.location.href = '../index.html';
    });
    id('audit').addEventListener('click', function() {
      window.location.href = '../auditpage/audit.html';
    });
    id('cart-button').addEventListener('click', function() {
      window.location.href = '../cartpage/cart.html';
    });
    id('logout').addEventListener('click', function() {
      logOut();
    });

    fetchCourse();
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
   * Fetches history information based on the netid.
   */
  async function fetchCourse() {
    let sign = await checksignin();
    if (!sign) {
      window.location.href = "../loginpage/login.html";
    } else {
      let netid = localStorage.getItem('netid');
      let url = `/yourplan/history/${netid}`;
      fetch(url)
        .then(statusCheck)
        .then(response => response.json())
        .then(data => {
          displayHistory(data);
        })
        .catch(handleError);
    }
  }

  /**
   * Processes and displays the course history data for different academic quarters.
   * @param {Object} data - The course data to be displayed.
   */
  function displayHistory(data) {
    quarterCourse(data, '2022', 'autumn', 'Autumn', 'au22');
    quarterCourse(data, '2022', 'winter', 'Winter', 'win22');
    quarterCourse(data, '2022', 'spring', 'Spring', 'spr22');

    quarterCourse(data, '2023', 'autumn', 'Autumn', 'au23');
    quarterCourse(data, '2023', 'winter', 'Winter', 'win23');
    quarterCourse(data, '2023', 'spring', 'Spring', 'spr23');
  }

  /**
   * Filters and displays courses for a specific academic quarter.
   * @param {Object} data - The complete course data.
   * @param {String} year - The year of the academic quarter.
   * @param {String} season - The season ('autumn', 'winter', 'spring') of the academic quarter.
   * @param {String} quarter - The display name of the quarter (e.g., 'Autumn').
   * @param {String} Id - The DOM element ID where the courses should be displayed.
   */
  function quarterCourse(data, year, season, quarter, Id) {
    let quar = data[year][season];
    addtitle(quarter, Id);
    quar.forEach(course => {
      id(Id).appendChild(addCourses(course));
    });
  }

  /**
   * Adds a title for a specific academic quarter section in the history display.
   * @param {String} quarter - The name of the quarter (e.g., 'Autumn').
   * @param {String} Id - The DOM element ID to which the title should be added.
   */
  function addtitle(quarter, Id) {
    let section = id(Id);
    section.innerHTML = '';
    let qua = document.createElement('h3');
    qua.textContent = quarter;
    section.appendChild(qua);
  }

  /**
   * Creates and returns an HTML article element representing a single course.
   * @param {Object} course - The course data to be displayed.
   * @returns {HTMLElement} An article element with course details.
   */
  function addCourses(course) {
    let article = document.createElement('article');
    article.className = 'course';
    let courseName = course.courseName;
    let courseTitle = document.createElement('h4');
    let courseLink = document.createElement('a');
    let tempCourseName = courseName.replace(' ', '-');
    courseLink.href = '/classpage/classpage.html';
    courseLink.addEventListener('click', function() {
      localStorage.setItem('selectedCourseName', tempCourseName);
    });
    courseLink.textContent = courseName + ' (' + course.credit + ')';
    courseTitle.appendChild(courseLink);
    article.appendChild(courseTitle);
    let grade = document.createElement('p');
    grade.textContent = 'Grade: ' + course.grade;
    article.appendChild(grade);
    return article;
  }

  /**
   * Utility function to find and return an element by its ID.
   * @param {string} id - The ID of the element to find.
   * @returns {HTMLElement} The DOM element associated with the given ID.
   */
  function id(id) {
    return document.getElementById(id);
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