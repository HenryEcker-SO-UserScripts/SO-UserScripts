// ==UserScript==
// @name         ReviewAuditDetector
// @description  Tries to detect audits when reviewing
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.2
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/ReviewAuditDetector.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/ReviewAuditDetector.user.js
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
/* globals $, StackExchange */

(function () {

    'use strict';
    StackExchange.ready(() => {
        const postTitleSelector = '.s-post-summary--content-title';

        $(document).on('ajaxComplete', (event, {responseJSON}, {url}) => {
            if ((
                url.startsWith('/review/next-task') || url.startsWith('/review/task-reviewed/')
            ) && (
                responseJSON?.reviewTaskId !== undefined
            )) {
                const postTitleBanner = document.querySelector(postTitleSelector);
                if (responseJSON.isAudit) {
                    postTitleBanner.innerHTML = '<span>(Audit) </span>' + postTitleBanner.innerHTML;
                    postTitleBanner.style.backgroundColor = 'var(--red-200)';
                }
            }
        });
    });
})();