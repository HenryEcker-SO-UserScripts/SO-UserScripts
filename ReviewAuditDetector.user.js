// ==UserScript==
// @name         ReviewAuditDetector
// @description  Tries to detect audits when reviewing
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.4
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
// @exclude      /^https?:\/\/.*((askubuntu|serverfault|stackapps|stackexchange|stackoverflow|superuser)\.com|mathoverflow\.net)\/review\/.*\/(stats|history)/
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
                    StackExchange.helpers.showToast('This is an audit', {type: 'danger', transientTimeout: 5000});
                } else {
                    // Hide any active toasts on new review page
                    StackExchange.helpers.hideToasts();
                }
            }
        });
    });
})();