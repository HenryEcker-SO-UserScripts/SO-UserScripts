// ==UserScript==
// @name         Staging Ground Title Link
// @description  The text "Staging Ground" is not a link, though it feels like it should be so this script adds that functionality
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.1
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/StagingGroundTitleAsLink.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/StagingGroundTitleAsLink.user.js
//
// @match        *://*.stackoverflow.com/staging-ground*
//
// @grant        none
//
// ==/UserScript==
/* globals $, StackExchange */

(function () {
    'use strict';
    StackExchange.ready(() => {
        $('.s-page-title--header').each((i, n) => {
            const e = $(n);
            e.html($(`<a class="s-page-title--header" href="/staging-ground">${e.text()}</a>`));
        });
    });
})();