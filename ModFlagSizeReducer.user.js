// ==UserScript==
// @name         ModFlagSizeReducer
// @description  Tries to make mod flags smaller where possible
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.7
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/ModFlagSizeReducer.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/ModFlagSizeReducer.user.js
//
// @match        *://*.stackoverflow.com/questions/*
// @match        *://*.askubuntu.com/questions/*
// @match        *://*.mathoverflow.net/questions/*
// @match        *://*.serverfault.com/questions/*
// @match        *://*.stackapps.com/questions/*
// @match        *://*.stackexchange.com/questions/*
// @grant        none
//
// ==/UserScript==
/* globals $ */

(function () {
    'use strict';

    const selectors = {
        css: {
            flagDialoguePopupClass: 'popup'
        },
        ids: {
            flagDialogueId: 'popup-flag-post',
            reduceButton: 'mfsr-reduce-pattern-btn'
        }
    };

    // Q & A patterns
    const bareShareQAPattern = new RegExp(`(?:(?<!]\\())(?:${window.location.origin})/([qa])\\/(\\d+)(?:\\/\\d+)?`, 'g');

    const shortQAPattern = new RegExp(`\\[(.*)]\\((?:${window.location.origin})?/([qa])\\/(\\d+)(?:\\/\\d+)?\\)`, 'g');
    const fullQPattern = new RegExp(`\\[(.*)]\\((?:${window.location.origin})?/questions/(\\d+)/[^\\/#]+\\)`, 'g');
    const fullAPattern = new RegExp(`\\[(.*)]\\((?:${window.location.origin})?/questions/\\d+/[^\\/]+/(\\d+)#\\d+\\)`, 'g');

    // Comment Patterns
    const fullCommentPattern = new RegExp(`\\[(.*)]\\((?:${window.location.origin})?/questions/\\d+(?:/[^\\/]+|/[^\\/]+/\\d+)#comment(\\d+)_\\d+\\)`, 'g');
    const shortCommentPattern = new RegExp(`\\[(.*)]\\((?:${window.location.origin})?(/posts/comments/\\d+)\\)`, 'g');

    // User
    const userProfilePattern = new RegExp(`\\[(.*)]\\((?:${window.location.origin})?/users/(\\d+)(/[^\\/]+)?\\)`, 'g');

    // Excess Space
    const excessSpacePattern = /\s{2,}/g;
    let ids = new Map();
    const reducers = [
        // Remove excess space
        (s) => s.replace(
            excessSpacePattern,
            ' '
        ),
        // Shorten domain/qa/postid/userid to just /qa/postid
        (s) => s.replace(
            shortQAPattern,
            '[$1](/$2/$3)'
        ),
        // Shorten domain/questions/postid/title to just /q/postid
        (s) => s.replace(
            fullQPattern,
            '[$1](/q/$2)'
        ),
        // Shorten domain/questions/questionid/title/answerid#answerid to just /a/answerid
        (s) => s.replace(
            fullAPattern,
            '[$1](/a/$2)'
        ),
        // Auto-Enumerate any bare post links
        // reduce domain/qa/post1id/userid? domain/qa/post2id/userid? to [1](/qa/post1id) [2](/qa/post2id),...
        (s) => {
            return s.replace(bareShareQAPattern, (sub, p1, p2) => {
                if (!ids.has(p2)) {
                    ids.set(p2, Math.max(0, ...ids.values()) + 1);
                }
                return `[${ids.get(p2)}](/${p1}/${p2})`;
            });
        },
        // Shorten domain/questions/postid/title#comment[commentid]_[postid] to just /posts/comments/commentid
        (s) => s.replace(
            fullCommentPattern,
            '[$1](/posts/comments/$2)'
        ),
        // Shorten domain/posts/comments/commentid to just /posts/comments/commentid
        (s) => s.replace(
            shortCommentPattern,
            '[$1]($2)'
        ),
        // Shorten domain/users/userid/uname to /users/userid
        (s) => s.replace(
            userProfilePattern,
            '[$1](/users/$2)'
        )
    ];

    const patternReducer = (text) => {
        return reducers.reduce((newText, reducer) => reducer(newText), text);
    };

    const testIsFlagPopup = (nodeEvent) => {
        return (
            $(nodeEvent.target).hasClass(selectors.css.flagDialoguePopupClass) && // Popup added
            $(nodeEvent.target).attr('id') === selectors.ids.flagDialogueId // Check is Flag popup
        );
    };

    let flagText = undefined; // Keep flag text (fragile save)

    $('.js-flag-post-link').on('click', () => {
        $(document).on('DOMNodeInserted', (nodeEvent) => {
            if (testIsFlagPopup(nodeEvent)) {
                ids = new Map(); // Clear map on load
                const textArea = $('textarea[name="otherText"]');
                textArea.on('input propertychange', (ev) => {
                    const reducedText = patternReducer(ev.target.value);
                    ev.target.value = reducedText;
                    flagText = reducedText;
                });

                if (flagText !== undefined) {
                    textArea.val(flagText);
                }
            }
        });

        $(document).on('DOMNodeRemoved', (nodeEvent) => {
            if (testIsFlagPopup(nodeEvent)) {
                // Clear listeners when closed
                $(document).off('DOMNodeInserted');
                $(document).off('DOMNodeRemoved');
            }
        });
    });
}());
