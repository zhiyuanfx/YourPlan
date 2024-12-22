/**
 * Zhiyuan Jia & Yuekai Xu
 * 10/28/2023
 * Section: CSE 154 AF
 * TA: Rasmus Makiniemi
 *
 *
 */

'use strict';
(function() {
  window.addEventListener('load', init);

  /**
   * Initializes the click event listeners for various navigation links on the web page.
   * When a link is clicked, it redirects the user to the corresponding page.
   */
  function init() {
    document.getElementById('error').textContent = localStorage.getItem('error');
  }
})();