// ==UserScript==
// @name         Textarea Reducer Stacks Controller
// @description  Registers a stacks controller that shortens relative links anywhere the controller is active
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.0.1
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/RegisterTextareaReducer.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/RegisterTextareaReducer.user.js
//
// @match        *://*.askubuntu.com/*
// @match        *://*.serverfault.com/*
// @match        *://*.stackapps.com/*
// @match        *://*.stackexchange.com/*
// @match        *://*.stackoverflow.com/*
// @match        *://*.superuser.com/*
// @match        *://*.mathoverflow.net/*
//
// @exclude      *://data.stackexchange.com/*
// @exclude      *://api.stackexchange.com/*
// @exclude      *://stackoverflow.blog/*
// @exclude      *://chat.stackoverflow.com/*
// @exclude      *://chat*.stackexchange.com/*
//
// @grant        none
//
// ==/UserScript==
/* globals StackExchange, Stacks */

(function () {
    'use strict';

    function registerAbsoluteLinkReducer() {
        const absoluteLinkPattern = new RegExp(`\\[(.*?)]\\((?:${window.location.origin})/([^)]+)\\)`, 'g');
        const shortestRelativeLinkReducer = [
            // Convert any absolute links to relative links
            (s) => {
                return s.replace(absoluteLinkPattern, '[$1](/$2)');
            },
            // Shorten /questions/postId/title to just /q/postId
            (s) => {
                return s.replace(/\[(.*?)]\(\/questions\/(\d+)\/[^/#]+(?:\?.+?)?\)/g, '[$1](/q/$2)');
            },
            // Shorten /questions/questionId/title/answerId#answerId to just /a/answerId
            (s) => {
                return s.replace(/\[(.*?)]\(\/questions\/\d+\/.+?#(\d+)(?:\?.+?)?\)/g, '[$1](/a/$2)');
            },
            // Shorten /questions/postId/title#comment[commentId]_[postId] to just /posts/comments/commentId
            (s) => {
                return s.replace(/\[(.*?)]\(\/questions\/\d+\/.+?#comment(\d+)_\d+\)/g, '[$1](/posts/comments/$2)');
            },
            // Shorten /users/userid/uname to /users/userid
            (s) => {
                return s.replace(/\[(.*?)]\(\/users\/(\d+)\/[^?]+(\?tab=.+?)?\)/g, (sub, p1, p2, p3) => {
                    if (p3 === void 0 || p3 === '?tab=profile') {
                        return `[${p1}](/users/${p2})`;
                    }
                    return `[${p1}](/users/${p2}${p3})`;
                });
            }
        ];

        function patternReducer(reducers, text, pos) {
            return reducers.reduce(([newText, newPos], reducer) => {
                const sLength = newText.length;
                newText = reducer(newText);
                newPos = Math.max(0, newPos - (sLength - newText.length));
                return [newText, newPos];
            }, [text, pos]);
        }

        Stacks.addController(
            'uhtr-size-reducer',
            {
                handleReduceAction(ev) {
                    const textarea = ev.target;
                    const [reducedText, selectionStart] = patternReducer(shortestRelativeLinkReducer, textarea.value, textarea.selectionStart);
                    textarea.value = reducedText;
                    textarea.selectionStart = selectionStart;
                    textarea.selectionEnd = selectionStart;
                }
            }
        );
    }

    StackExchange.ready(registerAbsoluteLinkReducer);
}());