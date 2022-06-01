// ==UserScript==
// @name         ModFlagSizeReducer
// @description  Tries to makes mod flags smaller where possible
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.1
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/ModFlagSizeReducer.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/ModFlagSizeReducer.user.js
//
// @match        *://*stackoverflow.com/questions/*
// @exclude      *://*stackoverflow.com/c/*
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
    const baseShortQAPattern = new RegExp(`(${window.location.origin})?/([qa])\\/(\\d+)(?:\\/\\d+)?`, 'g');

    const shortQAPattern = new RegExp(`\\[(.*)]\\(${baseShortQAPattern.source}\\)`, 'g');
    const fullQPattern = new RegExp(`\\[(.*)]\\((${window.location.origin})?/questions/(\\d+)/[^/]+\\)`, 'g');
    const fullAPattern = new RegExp(`\\[(.*)]\\((${window.location.origin})?/questions/\\d+/[^/]+/(\\d+)#\\d+\\)`, 'g');

    // Comment Patterns
    const fullCommentPattern = new RegExp(`\\[(.*)]\\((${window.location.origin})?/questions/\\d+/[^/]+\\/\\d+#comment(\\d+)_\\d+\\)`, 'g');
    const shortCommentPattern = new RegExp(`\\[(.*)]\\((${window.location.origin})?(/posts/comments/\\d+)\\)`, 'g');

    // Bulk
    const enumeratedShortPattern = /\[\d+]\(\/[qa]\/\d+\)/g;
    const commaSeparatedPostsPattern = new RegExp(`((?:${baseShortQAPattern.source}|${enumeratedShortPattern.source})(,\\s*))+(${baseShortQAPattern.source})`, 'g');

    // User
    const userProfilePattern = new RegExp(`\\[(.*)]\\((${window.location.origin})?/users/(\\d+)(/[^/]+)?\\)`, 'g');

    // Excess Space
    const excessSpacePattern = /\s{2,}/g;
    const reducers = [
        // Remove excess space
        (s) => s.replace(
            excessSpacePattern,
            ' '
        ),
        // Shorten domain/qa/postid/userid to just /qa/postid
        (s) => s.replace(
            shortQAPattern,
            '[$1](/$3/$4)'
        ),
        // Shorten domain/questions/postid/title to just /q/postid
        (s) => s.replace(
            fullQPattern,
            '[$1](/q/$3)'
        ),
        // Shorten domain/questions/questionid/title/answerid#answerid to just /a/answerid
        (s) => s.replace(
            fullAPattern,
            '[$1](/a/$3)'
        ),
        // Bulk Enumerate and reduce domain?/qa/post1id/userid?,domain?/qa/post2id/userid? to [1](/qa/post1id), [2](/qa/post2id),...
        (s) => s.replace(commaSeparatedPostsPattern, (substring) => {
            let ids = new Map();
            return substring.replace(baseShortQAPattern, (sub, p1, p2, p3) => {
                if (!ids.has(p3)) {
                    ids.set(p3, Math.max(0, ...ids.values()) + 1);
                }
                if (!p1) {
                    return sub;
                } else {
                    return `[${ids.get(p3)}](/${p2}/${p3})`;
                }
            });
        }),
        // Shorten domain/questions/postid/title#comment[commentid]_[postid] to just /posts/comments/commentid
        (s) => s.replace(
            fullCommentPattern,
            '[$1](/posts/comments/$3)'
        ),
        // Shorten domain/posts/comments/commentid to just /posts/comments/commentid
        (s) => s.replace(
            shortCommentPattern,
            '[$1]($3)'
        ),
        // Shorten domain/users/userid/uname to /users/userid
        (s) => s.replace(
            userProfilePattern,
            '[$1](/users/$3)'
        )
    ];

    const patternReducer = (text) => {
        for (let reducer of reducers) {
            text = reducer(text);
        }
        return text;
    };

    const testIsFlagPopup = (nodeEvent) => {
        return (
            $(nodeEvent.target).hasClass(selectors.css.flagDialoguePopupClass) && // Popup added
            $(nodeEvent.target).attr('id') === selectors.ids.flagDialogueId // Check is Flag popup
        );
    };

    $('.js-flag-post-link').on('click', () => {
        $(document).on('DOMNodeInserted', (nodeEvent) => {
            if (testIsFlagPopup(nodeEvent)) {
                const textArea = $('textarea[name="otherText"]');
                textArea.on('input propertychange', (ev) => {
                    textArea.val(patternReducer(ev.target.value));
                });
            }
        });

        $(document).on('DOMNodeRemoved', function (nodeEvent) {
            if (testIsFlagPopup(nodeEvent)) {
                // Clear listeners when closed
                $(document).off('DOMNodeInserted');
                $(document).off('DOMNodeRemoved');
            }
        });
    });
}());