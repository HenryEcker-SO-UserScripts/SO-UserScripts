// ==UserScript==
// @name         Toast Suppressor
// @description  Suppress just the "You haven&#39;t voted on questions in a while; questions need votes too!" toast
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.1
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/SEToastSuppressor.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/SEToastSuppressor.user.js
//
// @match        *://*.askubuntu.com/questions/*
// @match        *://*.serverfault.com/questions/*
// @match        *://*.stackapps.com/questions/*
// @match        *://*.stackexchange.com/questions/*
// @match        *://*.stackoverflow.com/questions/*
// @match        *://*.superuser.com/questions/*
// @match        *://*.mathoverflow.net/questions/*
// @grant        none
//
// ==/UserScript==
/* globals StackExchange */

(function () {
    'use strict';

    StackExchange.ready(() => {
        const showToast = StackExchange.helpers.showToast;
        StackExchange.helpers.showToast = (message, config) => {
            if (message !== 'You haven&#39;t voted on questions in a while; questions need votes too!') {
                showToast(message, config);
            }
        };
    });
}());