// ==UserScript==
// @name         Comment Link Modifier
// @description  Changes comment links to user /posts/comments/:comment_id instead of the standard long link that includes the title
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.5
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/CommentLinkModifier.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/CommentLinkModifier.user.js
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
/* globals StackExchange, $ */

(function () {
    'use strict';

    const commentLinkSelector = '.comment-link';
    const commentComponentContainerSelector = '.js-post-comments-component';
    const showMoreCommentsButtonSelector = '.js-show-link.comments-link:not(.dno)';

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

    // Watch for the addition of the dno class to the comment selector
    // This indicates that the comments have been loaded, so we can replace the links once again
    const classNameObserver = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.attributeName === 'class') {
                if (/dno/.exec(mutation.target.className)) {
                    updateCommentLinks(
                        $(mutation.target)
                            .closest(commentComponentContainerSelector) // Only check comments in this container
                            .find(commentLinkSelector)
                    );
                }
            }
        }
    });


    StackExchange.ready(() => {
        updateCommentLinks($(commentLinkSelector));
        // Bind the observer to all Show More buttons
        $(showMoreCommentsButtonSelector).each((i, e) => {
            return classNameObserver.observe(e, {
                attributes: true,
                childList: false,
                subtree: false,
                characterData: false,
                attributeFilter: ['class']
            });
        });
    });
}());