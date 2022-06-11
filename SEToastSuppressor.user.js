// ==UserScript==
// @name         SE Toast Suppressor
// @description  Suppress just the "You haven&#39;t voted on questions in a while; questions need votes too!" toast
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.2
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
//
// @match        *://*.askubuntu.com/review/*
// @match        *://*.serverfault.com/review/*
// @match        *://*.stackapps.com/review/*
// @match        *://*.stackexchange.com/review/*
// @match        *://*.stackoverflow.com/review/*
// @match        *://*.superuser.com/review/*
// @match        *://*.mathoverflow.net/review/*
//
// @exclude      *://*.askubuntu.com/review/*/stats
// @exclude      *://*.askubuntu.com/review/*/history
// @exclude      *://*.serverfault.com/review/*/stats
// @exclude      *://*.serverfault.com/review/*/history
// @exclude      *://*.stackapps.com/review/*/stats
// @exclude      *://*.stackapps.com/review/*/history
// @exclude      *://*.stackexchange.com/review/*/stats
// @exclude      *://*.stackexchange.com/review/*/history
// @exclude      *://*.stackoverflow.com/review/*/stats
// @exclude      *://*.stackoverflow.com/review/*/history
// @exclude      *://*.superuser.com/review/*/stats
// @exclude      *://*.superuser.com/review/*/history
// @exclude      *://*.mathoverflow.net/review/*/stats
// @exclude      *://*.mathoverflow.net/review/*/history
//
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