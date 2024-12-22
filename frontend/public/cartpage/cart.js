/*
 * Name: Zhiyuan Jia & Yuekai Xu
 * Date: 10/28/2023
 * Section: CSE 154 AF
 * TA: Rasmus
 * This is the JS to implement the UI for our cart.html page. It allows the user
 * to view the already selected sections, send all sections to registration,
 * delete all current selections, and navigate through the main pages of the website.
 */

"use strict";
(function() {
  const REGISTER_REQUIREMENT = "To Successfully Register, make sure there are no " +
    "time conflicts, no duplicate courses, no courses already taken in the past. " +
    "Also make sure you have completed all pre-requisites for the intended courses, " +
    "and that the intended courses are within your major or major requirements.";
  window.addEventListener("load", init);

  /** Initializes the web page. */
  function init() {
    loadAllCourses();
    qs("#alerts li").textContent = REGISTER_REQUIREMENT;
    id("main-page").addEventListener("click", function() {
      window.location.href = "../index.html";
    });
    id("audit").addEventListener("click", function() {
      window.location.href = "../auditpage/audit.html";
    });
    id("history").addEventListener("click", function() {
      window.location.href = "../history/history.html";
    });
    id('logout').addEventListener('click', logOut);
    id("registerall").addEventListener("click", registerAll);
  }

  /** Loads all the courses in the cart and registered courses. */
  async function loadAllCourses() {
    if (!await checksignin()) {
      window.location.href = "../loginpage/login.html";
    } else {
      id("registered").innerHTML = "";
      id("added").innerHTML = "";
      fetch("/yourplan/cart/" + localStorage.getItem("netid"))
        .then(statusCheck)
        .then(res => res.json())
        .then(displayCourses)
        .catch();
    }
  }

  /**
   * Displays the courses on the page given the course data retrived
   * from yourplan api.
   * @param {JSON} data - The course data.
   */
  function displayCourses(data) {
    let containers = ["added", "registered"];
    for (let i = 0; i < containers.length; i++) {
      let container = id(containers[i]);
      let courses = data[containers[i]];
      for (let j = 0; j < courses.length; j++) {
        let course = courses[j];
        let art = gen("article");
        art.classList.add("course");
        let quizSection = course.quiz["section_name"];
        let code = course["confirmation_code"] ? course["confirmation_code"] : null;
        art.appendChild(getLecture(course.lecture, course.courseName, quizSection, code));
        art.appendChild(getQuiz(course.quiz, course.courseName));
        container.appendChild(art);
      }
    }
    let addedtitle = id("addedtitle");
    let registeredtitle = id("registeredtitle");
    if (qsa("#added article").length > 0) {
      addedtitle.classList.remove("hidden");
    } else {
      addedtitle.classList.add("hidden");
    }
    if (qsa("#registered article").length > 0) {
      registeredtitle.classList.remove("hidden");
    } else {
      registeredtitle.classList.add("hidden");
    }
  }

  /**
   * Returns the lecture card generated from the given lecture data.
   * @param {JSON} data - The lecture data.
   * @param {string} courseName - The course name.
   * @param {string} quizSection - The quiz section of this lecture.
   * @param {string} code - The confirmation code of this lecture.
   * @returns {HTMLElement} DOM card of the lecture.
   */
  function getLecture(data, courseName, quizSection, code) {
    let lecture = gen("article");
    let nameSection = gen("section");
    let title = gen("h2");
    title.textContent = courseName + " " + data["section_name"];
    title.addEventListener("click", goToCourseDetail);
    nameSection.appendChild(title);
    if (code === null) {
      let deletebtn = gen("button");
      deletebtn.textContent = "delete";
      deletebtn.addEventListener("click", () => {
        removeFromCart(courseName, data["section_name"], quizSection);
        loadAllCourses();
      });
      nameSection.appendChild(deletebtn);
    }
    lecture.appendChild(nameSection);
    let instructor = gen("p");
    instructor.textContent = "Instructor: " + data.instructor;
    let time = gen("p");
    time.textContent = data.scheduleDay + " " + data.scheduleTime;
    lecture.appendChild(instructor);
    lecture.appendChild(time);
    if (code !== null) {
      let codeText = gen("p");
      codeText.textContent = "Confirmation Code: " + code;
      lecture.appendChild(codeText);
    }
    return lecture;
  }

  /**
   * Removes the given section from cart using the yourplan api.
   * @param {string} courseName - The course name.
   * @param {string} lecture - The lecture section to be removed.
   * @param {string} quiz - The quiz section to be removed.
   */
  function removeFromCart(courseName, lecture, quiz) {
    let data = new FormData();
    data.append("netid", localStorage.getItem("netid"));
    data.append("courseName", courseName);
    data.append("lecture", lecture);
    data.append("quiz", quiz);
    fetch("/yourplan/updatecart/false", {method: "POST", body: data})
      .then(statusCheck)
      .then(res => res.json())
      .then(res => {
        if (res.ifSuccess) {
          loadAllCourses();
        }
      })
      .catch(handleError);
  }

  /**
   * Returns the quiz card generated from the given quiz data.
   * @param {JSON} data - The quiz data.
   * @param {string} courseName - The course name.
   * @returns {HTMLElement} DOM card of the quiz.
   */
  function getQuiz(data, courseName) {
    let quiz = gen("article");
    let name = gen("h3");
    name.textContent = courseName + " " + data["section_name"];
    let instructor = gen("p");
    instructor.textContent = "Instructor: " + data.instructor;
    let time = gen("p");
    time.textContent = data.scheduleDay + " " + data.scheduleTime;
    quiz.appendChild(name);
    quiz.appendChild(instructor);
    quiz.appendChild(time);
    return quiz;
  }

  /**
   * Attempts to send all current courses in the cart to registration. Displays
   * warning message if failed.
   */
  function registerAll() {
    let data = new FormData();
    data.append("netid", localStorage.getItem("netid"));
    fetch("/yourplan/register", {method: "POST", body: data})
      .then(statusCheck)
      .then(res => res.json())
      .then(res => {
        qs("#alerts li").textContent = res.note;
        loadAllCourses();
      })
      .catch(handleError);
  }

  /**
   * Navigates to the clicked course's detail page.
   */
  function goToCourseDetail() {
    let className = this.textContent;
    className = className.split(" ");
    localStorage.setItem("selectedCourseName", className[0] + " " + className[1]);
    window.location.href = "../classpage/classpage.html";
  }

  /** Logs Out the current user. */
  function logOut() {
    let data = new FormData();
    data.append("netid", localStorage.getItem("netid"));
    fetch("/yourplan/logout", {method: "POST", body: data})
      .then(statusCheck)
      .then(res => res.json())
      .then(() => {
        localStorage.setItem("netid", null);
        window.location.href = "../index.html";
      })
      .catch(handleError);
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
   * Finds the element with the specified ID attribute.
   * @param {string} id - element ID
   * @returns {HTMLElement} DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Finds the first element satisfying the specified selector.
   * @param {string} selector - the selector
   * @returns {HTMLElement} DOM object associated with the selector.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Creates a new HTML element with the specified tag name.
   * @param {string} tagName - The HTML tag for the element to be created.
   * @returns {HTMLElement} The created HTML element with the given tag name.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }

  /**
   * Finds all the element satisfying the specified selector.
   * @param {string} selector - The selector.
   * @returns {DOMList} A list of all the DOM objects associated with the selector.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
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

})();