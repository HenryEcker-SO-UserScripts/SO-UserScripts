// ==UserScript==
// @name         Comment Link Modifier
// @description  Changes comment links to user /posts/comments/:comment_id instead of the standard long link that includes the title
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.1
// @downloadURL
// @updateURL
//
// @match        *://*stackoverflow.com/questions/*
// @match        *://*stackoverflow.com/review/*
// @grant        none
//
// ==/UserScript==
/* globals $ */

(function () {
    'use strict';

    const commentSelector = '.comment-link';
    const buildNewPath = (commentId) => `/posts/comments/${commentId}`;
    $(commentSelector).each((idx, elem) => {
        const jQElem = $(elem);
        jQElem.attr('href', buildNewPath(jQElem.closest('li').attr('data-comment-id')));
    });
}());