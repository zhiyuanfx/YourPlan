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
  let type = '.course-list';

  /**
   * Initializes the click event listeners for various navigation links on the web page.
   * When a link is clicked, it redirects the user to the corresponding page.
   */
  function init() {
    fetchParameter();
    id('main-page').addEventListener('click', function() {
      window.location.href = '../index.html';
      fetchParameter();
    });
    id('audit').addEventListener('click', function() {
      window.location.href = '../auditpage/audit.html';
    });
    id('cart-button').addEventListener('click', function() {
      window.location.href = '../cartpage/cart.html';
    });
    id('history').addEventListener('click', function() {
      window.location.href = '../history/history.html';
    });

    signBtn();

    courseBoard();
  }

  /**
   * Check whether the user log in to change the login button.
   */
  async function signBtn() {
    let sign = await checksignin();
    if (sign) {
      id('log-in').textContent = 'Log Out';
      id('log-in').addEventListener('click', function() {
        logOut();
      });
    } else {
      id('log-in').textContent = 'Log in';
      id('log-in').addEventListener('click', function() {
        window.location.href = '../loginpage/login.html';
      });
    }
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
   * Add the evenListener to each button.
   */
  function courseBoard() {
    let searchBtn = document.getElementById('course-search-form');
    searchBtn.addEventListener('submit', temp => {
      temp.preventDefault();
      fetchParameter();
    });

    let savedDisplayType = localStorage.getItem('displayType') || 'list';
    document.getElementById('show-type').value = savedDisplayType;
    toggleCourseDisplay();
    document.getElementById('show-type').addEventListener('change', function(temp) {
      temp.preventDefault();
      localStorage.setItem('displayType', this.value);
      toggleCourseDisplay();
      fetchParameter();
    });
    document.getElementById('credit').addEventListener('change', function(temp) {
      temp.preventDefault();
      fetchParameter();
    });
    document.getElementById('category').addEventListener('change', function(temp) {
      temp.preventDefault();
      fetchParameter();
    });
  }

  /**
   * Fetches the current search parameters and calls fetchCourses with them.
   */
  function fetchParameter() {
    fetchCourses(
      document.getElementById('search').value.trim(),
      document.getElementById('category').value,
      document.getElementById('credit').value
    );
  }

  /**
   * Toggles the course display between list and grid views.
   */
  function toggleCourseDisplay() {
    let showType = document.getElementById('show-type').value;
    let courseContainer = document.querySelector(type);

    if (showType === 'grid') {
      courseContainer.className = 'course-grid';
      type = '.course-grid';
    } else {
      courseContainer.className = 'course-list';
      type = '.course-list';
    }
  }

  /**
   * Fetches courses from the server using specified search parameters.
   * @param {string|null} keyword - The search keyword entered by the user, if any.
   * @param {string} category - The selected course category filter.
   * @param {string} credit - The selected course credit filter.
   */
  function fetchCourses(keyword = '', category = 'all', credit = 'all') {
    let url = new URL('/yourplan/allcourses', window.location.origin);
    if (keyword) {
      url.searchParams.append('keyword', encodeURIComponent(keyword));
    }
    if (category !== 'all') {
      let temp = encodeURIComponent(category.charAt(0).toUpperCase() + category.slice(1));
      url.searchParams.append('category', temp);
    }
    if (credit !== 'all') {
      url.searchParams.append('credit', encodeURIComponent(credit));
    }
    fetch(url)
      .then(statusCheck)
      .then(response => response.json())
      .then(data => {
        displayCourse(data);
      })
      .catch(err => {
        handleError(err);
      });
  }

  /**
   * Constructs and appends a card element for each course in the data.
   * @param {object} data - The data object containing an array of courses.
   */
  function displayCourse(data) {
    let courseType = (type === '.course-list') ? 'course-item-list' : 'course-item';
    let courseSection = document.querySelector(type);
    courseSection.innerHTML = '';
    if (data.courses.length > 0) {
      for (let i = 0; i < data.courses.length; i++) {
        courseSection.appendChild(courseCard(data.courses[i], courseType));
      }
    } else {
      let none = document.createElement('p');
      none.textContent = 'No courses found.';
      courseSection.append(none);
    }
  }

  /**
   * Constructs a card element for a single yip.
   * @param {object} course - The yip data used to construct the card.
   * @param {String} courseType - The yip data used to construct the card.
   * @returns {HTMLElement} - The constructed yip card element.
   */
  function courseCard(course, courseType) {
    let card = document.createElement('div');
    card.className = courseType;
    card.id = course;
    let courseName = document.createElement('h3');
    let courseHerf = document.createElement('a');
    courseHerf.href = '/classpage/classpage.html';
    courseHerf.textContent = course['course_name'];
    courseHerf.id = course['course_name'];
    courseHerf.addEventListener('click', function() {
      localStorage.setItem('selectedCourseName', course['course_name']);
    });
    courseName.appendChild(courseHerf);
    let courseTitle = document.createElement('p');
    courseTitle.textContent = course['title'];
    let courseCredit = document.createElement('span');
    courseCredit.className = 'credit';
    courseCredit.textContent = course['credit'];
    let courseCate = document.createElement('p');
    courseCate.className = 'category';
    courseCate.textContent = course['category'];
    card.appendChild(courseName);
    card.appendChild(courseTitle);
    card.appendChild(courseCredit);
    card.appendChild(courseCate);
    return card;
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
    window.location.href = "../errorpage/error.html";
    if (typeof error === 'string') {
      localStorage.setItem('error', error);
    } else {
      localStorage.setItem('error', 'Error: Unknown error');
    }
  }

  /**
   * Finds the element with the specified ID attribute.
   * @param {string} id - element ID
   * @returns {HTMLElement} DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }
})();