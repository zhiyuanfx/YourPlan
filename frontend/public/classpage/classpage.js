/*
 * Name: Zhiyuan Jia & Yuekai Xu
 * Date: 10/28/2023
 * Section: CSE 154 AF
 * TA: Rasmus
 * This is the JS to implement the UI for our classpage.html page. It allows the user
 * to navigate through the main pages of the websites, adds classes and sections
 * to the cart, and view the basic information of each section.
 */

'use strict';
(function() {

  window.addEventListener('load', init);

  /** Initializes the web page. */
  function init() {
    id('error').innerHTML = '';
    id('main-page').addEventListener('click', function() {
      window.location.href = '../index.html';
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

    fetchCourse(localStorage.getItem('selectedCourseName'));
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
   * Fetches courses from the server using specified search parameters.
   * @param {String} courseName name of the course
   */
  function fetchCourse(courseName) {
    courseName = courseName.replace(' ', '-');
    let url = `/yourplan/coursedetail/${courseName}`;
    fetch(url)
      .then(statusCheck)
      .then(response => response.json())
      .then(data => {
        displayCourseDetails(data);
      })
      .catch(handleError);
  }

  /**
   * Displays details of a course on the page.
   * @param {Object} courseData - Data about the course to display.
   */
  function displayCourseDetails(courseData) {
    document.querySelector('h1').textContent =
                                    courseData.courseName + ' (Credit: ' + courseData.credit + ')';
    document.getElementById('description').textContent = courseData.description;
    if (courseData.preRequisites.length > 0) {
      courseData.preRequisites.forEach(course => {
        document.getElementById('prereq').textContent += course['course_name'] + ' ';
      });
    } else {
      document.getElementById('prereq').textContent += 'None';
    }
    document.getElementById('department').textContent += courseData.department;
    let sectionsBlock = document.querySelector('main');
    courseData.sections.forEach(section => {
      sectionsBlock.appendChild(addSection(courseData, section));
    });
  }

  /**
   * Creates and returns a DOM element for a course section.
   * @param {Object} courseData - Data about the course.
   * @param {Object} section - Data about the section.
   * @returns {HTMLElement} A DOM element representing the section.
   */
  function addSection(courseData, section) {
    let sectionBlock = document.createElement('section');
    let lectureArticle = document.createElement('article');
    lectureArticle.className = 'lecture';
    let courseSection = document.createElement('section');
    courseSection = addName(null, lectureArticle, courseData, section, 'lecture');

    let instructorSection = document.createElement('section');

    instructorSection = addInstructor(section);

    let timeSection = document.createElement('section');
    timeSection = addTime(section);

    lectureArticle.appendChild(courseSection);
    lectureArticle.appendChild(instructorSection);
    lectureArticle.appendChild(timeSection);
    sectionBlock.appendChild(lectureArticle);

    section.quizzes.forEach(quiz => {
      sectionBlock.appendChild(addQuiz(courseData, quiz, lectureArticle));
    });
    return sectionBlock;
  }

  /**
   * Creates and returns an HTML article element representing a quiz section.
   * @param {Object} courseData - Data about the course, used to construct the quiz section header.
   * @param {Object} section - Data about the quiz section, including instructor and schedule.
   * @param {HTMLElement} lectureArticle - An HTML section element for lecture.
   * @returns {HTMLElement} An HTML article element representing the quiz section.
   */
  function addQuiz(courseData, section, lectureArticle) {
    let quizArticle = document.createElement('article');
    quizArticle.className = 'quiz';
    let courseSection = document.createElement('section');

    courseSection = addName(quizArticle, lectureArticle, courseData, section, 'quiz');

    let instructorSection = document.createElement('section');

    instructorSection = addInstructor(section);

    let timeSection = document.createElement('section');
    timeSection = addTime(section);

    quizArticle.appendChild(courseSection);
    quizArticle.appendChild(instructorSection);
    quizArticle.appendChild(timeSection);
    return quizArticle;
  }

  /**
   * Creates and returns an HTML section element containing the course or quiz name and a button.
   * This section is used to display the name of the course or quiz and to allow
   * users to add it to their cart.
   * @param {HTMLElement} quizArticle - An HTML section element for quiz.
   * @param {HTMLElement} lectureArticle - An HTML section element for lecture.
   * @param {Object} courseData - Data about the course, including its name.
   * @param {Object} section - Data about the current section (course/quiz).
   * @param {String} type - A string indicating whether the section is a course or a quiz.
   * @returns {HTMLElement} An HTML section element with course/quiz name and a cart button.
   */
  function addName(quizArticle, lectureArticle, courseData, section, type) {
    let courseSection = document.createElement('section');
    let course = document.createElement('h2');
    course.textContent = courseData.courseName + ' ' +
                        section[type] + '  (' + (section.currentEnroll) + '/' +
                        section.capacity + ')';
    courseSection.appendChild(course);
    if (type === 'quiz') {
      let cartBtn = document.createElement('button');
      cartBtn.textContent = 'Add To Cart';

      cartBtn.addEventListener('click', async function() {
        let sign = await checksignin();
        if (!sign) {
          window.location.href = "../loginpage/login.html";
        } else {
          let courseName = courseData.courseName;
          addCart(courseName, section[type], quizArticle, lectureArticle);
        }
      });
      courseSection.appendChild(cartBtn);
    }
    return courseSection;
  }

  /**
   * Creates and returns an HTML section element for displaying the instructor's name.
   * @param {Object} section - Data about the current section, including the instructor's name.
   * @returns {HTMLElement} An HTML section element containing the instructor's name.
   */
  function addInstructor(section) {
    let instructorSection = document.createElement('section');
    let insTemp = document.createElement('p');
    insTemp.textContent = 'Instructor:';
    let instructor = document.createElement('p');
    instructor.textContent = section.instructor;

    instructorSection.appendChild(insTemp);
    instructorSection.appendChild(instructor);
    return instructorSection;
  }

  /**
   * Creates and returns an HTML section element for displaying the schedule of a course or quiz.
   * This includes the day of the week and the time of the class or quiz.
   * @param {Object} section - Data about the current section, including schedule details.
   * @returns {HTMLElement} An HTML section element with scheduling information.
   */
  function addTime(section) {
    let timeSection = document.createElement('section');
    let timeTemp = document.createElement('p');
    timeTemp.textContent = 'Schedule';
    let weekDay = document.createElement('p');
    weekDay.textContent = section.scheduleDay;
    let dayTime = document.createElement('p');
    dayTime.textContent = section.scheduleTime;

    timeSection.appendChild(timeTemp);
    timeSection.appendChild(weekDay);
    timeSection.appendChild(dayTime);
    return timeSection;
  }

  /**
   * Adds a class to the provided HTML article element to indicate it has been added to the cart.
   * This is typically used as a visual cue for users.
   * @param {String} courseName the course name.
   * @param {String} quiz the quiz name.
   * @param {HTMLElement} quizAr the HTML element for quiz.
   * @param {HTMLElement} lectureAr the HTML element for lecture.
   */
  function addCart(courseName, quiz, quizAr, lectureAr) {
    let lecture = quiz.charAt(0);
    updateCart(localStorage.getItem('netid'), courseName, lecture, quiz, quizAr, lectureAr);
  }

  /**
   * update the cart when the course is added
   * @param {String} netid the id for the user.
   * @param {String} courseName the name for the course.
   * @param {String} lecture the section of the lecture.
   * @param {String} quiz the section for the quiz.
   * @param {HTMLElement} quizArticle the HTML element for quiz.
   * @param {HTMLElement} lectureArticle the HTML element for lecture.
   */
  function updateCart(netid, courseName, lecture, quiz, quizArticle, lectureArticle) {
    let url = `/yourplan/updatecart/true`;
    let dataItem = {
      netid,
      courseName,
      lecture,
      quiz
    };
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataItem)
    })
      .then(statusCheck)
      .then(response => response.json())
      .then(data => {
        if (data.ifSuccess) {
          quizArticle.classList.add('added');
          lectureArticle.classList.add('added');
        } else {
          addText();
        }
      })
      .catch(handleError);
  }

  /**
   * add error text when the course is already taken or in the cart.
   */
  function addText() {
    let errorText = id('error');
    errorText.innerHTML = '';
    let text = document.createElement('p');
    text.textContent = 'The course has already in the cart.';
    errorText.appendChild(text);
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
   * Finds the element with the specified ID attribute.
   * @param {string} id - element ID
   * @returns {HTMLElement} DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }
})();