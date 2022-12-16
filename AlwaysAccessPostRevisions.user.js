// ==UserScript==
// @name         Post Revision Link
// @description  Adds a link to post revisions to all posts voting containers (including posts with no edits)
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.3
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/AlwaysAccessPostRevisions.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/AlwaysAccessPostRevisions.user.js
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
// @exclude      /^https?:\/\/.*((askubuntu|serverfault|stackapps|stackexchange|stackoverflow|superuser)\.com|mathoverflow\.net)\/review\/.*\/(stats|history)/
//
// ==/UserScript==
/* globals $ */

(function () {
    'use strict';

    const config = {
        votingContainerSelector: '.js-voting-container',
        timelineLinkSelector: 'a[href$="/timeline"]',
        votingContainerButtonClasses: 'flex--item s-btn s-btn__unset c-pointer py6 mx-auto',
        revisionButtonIcon: '<svg aria-hidden="true" class="svg-icon iconDocumentAlt" width="18" height="18" viewBox="0 0 18 18"><path d="M5 3a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Zm2 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-2 4.5c0-.28.22-.5.5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5Zm.5 1.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1 0-1ZM5 14.5c0-.28.22-.5.5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5Z"></path><path opacity=".4" d="M5.9 2h6.35A2.75 2.75 0 0 1 15 4.75v9.35c.62-.6 1-1.43 1-2.35v-7.5C16 2.45 14.54 1 12.75 1h-4.5c-.92 0-1.75.38-2.35 1Z"></path></svg>'
    };

    const main = () => {
        $(`${config.votingContainerSelector} ${config.timelineLinkSelector}`).each((i, n) => {
            const e = $(n);
            const postId = e.closest(config.votingContainerSelector).attr('data-post-id');
            const stacksTooltip = `--stacks-s-tooltip-aapr-${postId}`;
            // Add Link (and icon) to post revisions on all posts
            $(`<div id="${stacksTooltip}" class="s-popover s-popover__tooltip wmx2" role="tooltip">Show post revisions.<div class="s-popover--arrow" style=""></div></div>`).insertAfter(e);
            $(`<a href="/posts/${postId}/revisions" class="${config.votingContainerButtonClasses}" data-controller="s-tooltip" data-s-tooltip-placement="right" aria-label="Timeline" aria-describedby="${stacksTooltip}">${config.revisionButtonIcon}</a>`).insertAfter(e);
        });
    };

    // Monitor add buttons when review task is loaded
    $(document).on('ajaxComplete', (event, {responseJSON}, {url}) => {
        if (
            (url.startsWith('/review/next-task') || url.startsWith('/review/task-reviewed/')) &&
            responseJSON?.reviewTaskId !== undefined
        ) {
            main();
        }
    });

    // Run Script
    main();
})();