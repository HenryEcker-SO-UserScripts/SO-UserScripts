// ==UserScript==
// @name         ReviewAuditDetector
// @description  Tries to detect audits when reviewing
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.1
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/ReviewAuditDetector.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/ReviewAuditDetector.user.js
//
// @match        *://*.stackoverflow.com/review/*
// @match        *://*.askubuntu.com/review/*
// @match        *://*.mathoverflow.net/review/*
// @match        *://*.serverfault.com/review/*
// @match        *://*.stackapps.com/review/*
// @match        *://*.stackexchange.com/review/*
//
// @exclude      *://*.com/review/*/stats
// @exclude      *://*.com/review/*/history
//
// @run-at       document-start
//
// @grant        none
//
// ==/UserScript==
/* globals $ */

(function () {

    'use strict';

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
})();