// ==UserScript==
// @name         Comment Link Modifier
// @description  Changes comment links to user /posts/comments/:comment_id instead of the standard long link that includes the title
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.2
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/CommentLinkModifier.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/CommentLinkModifier.user.js
//
// @match        *://*stackoverflow.com/questions/*
// @grant        none
//
// ==/UserScript==
/* globals StackExchange, $ */

(function () {
    'use strict';
    StackExchange.ready(() => {
        const commentSelector = '.comment-link';
        const buildNewPath = (commentId) => `/posts/comments/${commentId}`;
        $(commentSelector).each((idx, elem) => {
            const jQElem = $(elem);
            jQElem.attr('href', buildNewPath(jQElem.closest('li').attr('data-comment-id')));
        });
    });
}());