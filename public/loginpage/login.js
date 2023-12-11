/*
 * Name: Zhiyuan Jia & Yuekai Xu
 * Date: 10/28/2023
 * Section: CSE 154 AF
 * TA: Rasmus
 * This is the JS to implement the UI for our login.html page. It allows the user
 * to go back to the homepage or attempt loging in with net-id and password.
 */

'use strict';
(function() {
  window.addEventListener('load', init);

  /** Initializes the web page. */
  function init() {
    id('mainpage').addEventListener('click', function() {
      window.location.href = '../index.html';
    });

    document.getElementById('login-form').addEventListener('submit', function(event) {
      event.preventDefault();

      let netid = document.getElementById('netid').value;
      let password = document.getElementById('password').value;

      signIn(netid, password);
    });

    let rememberedNetID = localStorage.getItem('rememberedNetID');
    if (rememberedNetID) {
      document.getElementById('netid').value = rememberedNetID;
      document.getElementById('rememberme').checked = true;
    }
  }

  /**
   * fetch the sign in data to the user.
   * @param {String} netid netid for the user.
   * @param {String} password passowrd for the user.
   */
  function signIn(netid, password) {
    document.getElementById('error').innerHTML = '';
    let requestOptions = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({netid, password})
    };

    fetch('/yourplan/signin', requestOptions)
      .then(statusCheck)
      .then(response => response.json())
      .then(data => {
        saveNetID(netid);
        mainPage(data);
      })
      .catch(handleError);
  }

  /**
   * save the netid when remember me click.
   * @param {Stirng} netid netid for the user.
   */
  function saveNetID(netid) {
    if (document.getElementById('rememberme').checked) {
      localStorage.setItem('rememberedNetID', netid);
    } else {
      localStorage.removeItem('rememberedNetID');
    }
    if (localStorage.getItem('netid') !== null) {
      localStorage.removeItem('netid');
    }
    localStorage.setItem('netid', netid);
  }

  /**
   * Back to main page.
   * @param {boolean} data back to main page check
   */
  function mainPage(data) {
    if (data) {
      window.location.href = '../index.html';
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
    let err = document.createElement('p');
    err.textContent = error;
    err.className = 'err';
    id('error').appendChild(err);
    localStorage.setItem('loginStatus', false);
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