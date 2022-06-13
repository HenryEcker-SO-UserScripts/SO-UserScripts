// ==UserScript==
// @name         Default Search Option to Public
// @description  Changes the search scope to public by default instead of All
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.3
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/DefaultPublicSearch.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/DefaultPublicSearch.user.js
//
// @match        *://*.stackoverflow.com/*
// @exclude      *://*stackoverflow.com/c/*
// @grant        none
//
// ==/UserScript==
/* globals StackExchange, $ */

(function () {
    'use strict';

    StackExchange.ready(() => {
        const select = $('#search select');
        if (select) {
            select.val('Public').change();
        }
    });
}());