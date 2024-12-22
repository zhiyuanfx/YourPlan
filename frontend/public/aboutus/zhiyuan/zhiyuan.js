/*
 * Name: Zhiyuan Jia
 * Date: 10/11/2023
 * Section: CSE 154 AF
 * TA: Rasmus
 * This is the JS to implement the UI for my zhiyuan.html page. It guides
 * the user to navigate through my images and secret and allows the
 * user to say hi.
 */

"use strict";
(function() {
  window.addEventListener("load", init);

  /** Initializes the web page. */
  function init() {
    qs("article h3").addEventListener("click", showHappyImage);
    qs("article + article h3").addEventListener("click", showSadImage);
    qs("section > h3").addEventListener("click", showQuote);
    qs("button").addEventListener("dblclick", updateGreetings);
    qs("article + h3").addEventListener("click", showOrHideSecret);
  }

  /** Updates the current greeting to the greeting list. */
  function updateGreetings() {
    let inputBox = qs("input");
    if (inputBox.value.trim() !== null) {
      let newParagraph = document.createElement("p");
      newParagraph.textContent = inputBox.value;
      inputBox.value = "";
      id("greetings").appendChild(newParagraph);
    }
  }

  /** Displays the happy image. */
  function showHappyImage() {
    let target = qs("img");
    target.classList.remove("hidden");
  }

  /** Displays the sad image. */
  function showSadImage() {
    let target = qs("article + article img");
    target.classList.remove("hidden");
  }

  /** Displays the hidden quote. */
  function showQuote() {
    let target = qs("h3 + article");
    target.classList.remove("hidden");
  }

  /** Shows or hides my secret. */
  function showOrHideSecret() {
    let target = qs("h3 + p");
    target.classList.toggle("hidden");
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
})();