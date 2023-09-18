// ==UserScript==
// @name         Comment Link Modifier
// @description  Changes comment links to user /posts/comments/:comment_id instead of the standard long link that includes the title
// @homepage     https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.8
// @downloadURL  https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/CommentLinkModifier.user.js
// @updateURL    https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/CommentLinkModifier.user.js
//
// @match        *://*.askubuntu.com/questions/*
// @match        *://*.serverfault.com/questions/*
// @match        *://*.stackapps.com/questions/*
// @match        *://*.stackexchange.com/questions/*
// @match        *://*.stackoverflow.com/questions/*
// @match        *://*.superuser.com/questions/*
// @match        *://*.mathoverflow.net/questions/*
//
// @exclude      *://*.askubuntu.com/questions/ask*
// @exclude      *://*.mathoverflow.net/questions/ask*
// @exclude      *://*.serverfault.com/questions/ask*
// @exclude      *://*.stackapps.com/questions/ask*
// @exclude      *://*.stackexchange.com/questions/ask*
// @exclude      *://*.stackoverflow.com/questions/ask*
// @exclude      *://*.superuser.com/questions/ask*
// @grant        none
//
// ==/UserScript==
/* globals StackExchange, $ */

(function () {
    'use strict';

    const commentLinkSelector = '.comment-link';
    const commentListSelector = '.comments-list.js-comments-list';

    const buildNewPath = (commentId) => {
        return `/posts/comments/${commentId}`;
    };

    const updateCommentLinks = (jQueryElems) => {
        setTimeout(() => {
            jQueryElems.each((idx, elem) => {
                const jQElem = $(elem);
                const newHREF = buildNewPath(jQElem.closest('li').attr('data-comment-id'));
                // Only update if not previously replaced
                if (newHREF !== jQElem.attr('href')) {
                    jQElem.attr('href', newHREF);
                }
            });
        }, 50);
    };

    const newCommentObserver = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                updateCommentLinks(
                    $(mutation.target).find(commentLinkSelector)
                );
                break; // a single mutation that adds comments will add all comments
            }
        }
    });


    StackExchange.ready(() => {
        updateCommentLinks($(commentLinkSelector));
        // Bind the observer to all posts
        $(commentListSelector).each((i, e) => {
            newCommentObserver.observe(e, {
                childList: true
            });
        });
    });
}());