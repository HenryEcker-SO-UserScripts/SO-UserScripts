// ==UserScript==
// @name         NATO Quicklink in Review Topbar
// @description  Adds a NATO Button to /review topbar button
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.1
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/NATOQuicklinkInReviewTopbar.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/NATOQuicklinkInReviewTopbar.user.js
//
// @match        *://*.askubuntu.com/*
// @match        *://*.serverfault.com/*
// @match        *://*.stackapps.com/*
// @match        *://*.stackexchange.com/*
// @match        *://*.stackoverflow.com/*
// @match        *://*.superuser.com/*
// @match        *://*.mathoverflow.net/*
//
// @grant        none
//
// ==/UserScript==
/* globals $, StackExchange */

(function () {
    'use strict';

    const addLinkToPopover = () => {
        const dialogueLinks = $('.js-review-dialog .-right');
        const s = dialogueLinks.html();
        if (s.includes('>Tools<')) { // has access to Tools
            dialogueLinks.html(`${s} • <a href="/tools/new-answers-old-questions">NATO</a>`);
        }
    };

    StackExchange.ready(() => {
        $(document).on('ajaxComplete', (_0, _1, {url}) => {
            if (url.startsWith('/topbar/review')) {
                addLinkToPopover();
            }
        });
    });
})();