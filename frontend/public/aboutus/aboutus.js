/*
 * Name: Zhiyuan Jia & Yuekai Xu
 * Date: 10/28/2023
 * Section: CSE 154 AF
 * TA: Rasmus
 * This is the JS to implement the UI for our aboutus.html page. It allows the user
 * to navigate to our self-introduction page.
 */

"use strict";
(function() {
  window.addEventListener("load", init);

  /** Initializes the web page. */
  function init() {
    id("yuekai").addEventListener("click", function() {
      window.location.href = "yuekai/yuekai.html";
    });
    id("zhiyuan").addEventListener("click", function() {
      window.location.href = "zhiyuan/zhiyuan.html";
    });
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