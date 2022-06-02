// ==UserScript==
// @name         ModFlagAndCommentSizeReducer
// @description  Tries to make mod flags and comments smaller where possible
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.0.5
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/ModFlagAndCommentSizeReducer.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/ModFlagAndCommentSizeReducer.user.js
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
/* globals StackExchange, $ */

(function () {
    'use strict';

    const config = {
        postFlagMaxLen: 500,
        commentMaxLen: 600
    };
    const selectors = {
        css: {
            flagDialoguePopupClass: 'popup'
        },
        ids: {
            flagDialogueId: 'popup-flag-post',
            reduceButton: 'mfacsr-reduce-pattern-btn'
        },
        attrs: {
            monitoredTextArea: 'data-mfacsr-monitored'
        }
    };

    // let ids = new Map();
    const absoluteLinkPattern = new RegExp(`\\[([^]]*)]\\((?:${window.location.origin})/([^)]+)\\)`);
    const bareLinkPattern = new RegExp(`(?<!]\\()${window.location.origin}\\/([qa])\\/(\\d+)(\\/\\d+)?`, 'g');

    const reducerTiers = [
        // Tier One Reducers
        [
            // Convert any absolute links to relative links
            (s) => s.replace(absoluteLinkPattern, '[$1](/$2)'),
            // Shorten /questions/postid/title to just /q/postid
            (s) => s.replace(/\[([^]]*)]\(\/questions\/(\d+)\/[^/#]+\)/g, '[$1](/q/$2)'),
            // Shorten /questions/questionid/title/answerid#answerid to just /a/answerid
            (s) => s.replace(/\[([^]]*)]\(\/questions\/\d+\/[^/]+\/(\d+)#\d+\)/g, '[$1](/a/$2)'),
            // Convert any bare post links to [1](/qa/postid/userid)
            (s) => s.replace(bareLinkPattern, '[1](/$1/$2$3)'),
            // Enumerate numbered links (Goes back through to renumber any existing short-links when needed
            (s) => {
                const ids = new Map();
                return s.replace(/\[\d+]\(\/([qa])\/(\d+)(\/\d+)?\)/g, (sub, p1, p2, p3) => {
                    if (!ids.has(p2)) {
                        ids.set(p2, Math.max(0, ...ids.values()) + 1);
                    }
                    return `[${ids.get(p2)}](/${p1}/${p2}${p3 || ''})`;
                });
            },
            // Shorten /questions/postid/title#comment[commentid]_[postid] to just /posts/comments/commentid
            (s) => s.replace(/\[([^]]*)]\(\/questions\/\d+(?:\/[^/]+|\/[^/]+\/\d+)#comment(\d+)_\d+\)/g, '[$1](/posts/comments/$2)'),
            // Shorten /users/userid/uname to /users/userid
            (s) => s.replace(/\[([^]]*)]\(\/users\/(\d+)\/[^/#]+\)/g, '[$1](/users/$2)')
        ],
        // Tier Two Reducers
        [
            // Shorten /qa/postid/userid to just /qa/postid
            (s) => s.replace(/\[([^]]*)]\(\/([qa])\/(\d+)\/(\d+)?\)/g, '[$1](/$2/$3)'),
            // Remove any excess whitespace
            (s) => s.replace(/\s{2,}/g, ' ')
        ]
    ];

    const posTrackingReplace = (text, reducer, pos) => {
        let sLength = text.length;
        // Replace Text
        text = reducer(text);
        // Assumes pattern always reduces size (which is the point)
        pos = Math.max(0, pos - (sLength - text.length));
        // Return the string and the updated position
        return [text, pos];
    };

    const patternReducer = (reducers, text, pos) => {
        return reducers.reduce((
            [newText, newPos], reducer
        ) => posTrackingReplace(newText, reducer, newPos), [text, pos]);
    };

    const testIsFlagPopup = (nodeEvent) => {
        return (
            $(nodeEvent.target).hasClass(selectors.css.flagDialoguePopupClass) && // Popup added
            $(nodeEvent.target).attr('id') === selectors.ids.flagDialogueId // Check is Flag popup
        );
    };

    const testIsCommentBox = (nodeEvent) => {
        return (
            $(nodeEvent.target).is('textarea.s-textarea.js-comment-text-input')
        );
    };

    const textAreaMonitor = (textArea, maxLen, cb = undefined) => {
        if (textArea.attr(selectors.attrs.monitoredTextArea) !== true) { // prevent adding the listener multiple times
            textArea.on('input propertychange', (ev) => {
                let reducedText = ev.target.value;
                let selectionStart = ev.target.selectionStart;
                for (const reducers of reducerTiers) {
                    let [reducedText, selectionStart] = patternReducer(reducers, reducedText, selectionStart);
                    // If reducedText is under maxLen stop reducing
                    if (reducedText.length <= maxLen) {
                        break;
                    }
                }
                ev.target.value = reducedText;
                // Fix Cursor Position
                ev.target.selectionStart = selectionStart;
                ev.target.selectionEnd = selectionStart;

                // Optionally do something else with reducedText and selectionStart
                if (cb) cb(reducedText, selectionStart);
            });
            textArea.attr(selectors.attrs.monitoredTextArea, true);
        }
    };

    StackExchange.ready(() => {
        let flagText = undefined; // Keep flag text (fragile save)
        $(document).on('DOMNodeInserted', (nodeEvent) => {
            if (testIsFlagPopup(nodeEvent)) {
                const textArea = $('textarea[name="otherText"]');

                textAreaMonitor(textArea, config.postFlagMaxLen, (reducedText) => {
                    flagText = reducedText;
                });

                if (flagText !== undefined) {
                    const inputButton = $('input[value="PostOther"]');
                    inputButton.trigger('click');
                    inputButton.trigger('change');

                    textArea.val(flagText);
                    textArea.trigger('input');
                    textArea.trigger('propertychange');
                    textArea.focus();
                }
            } else if (testIsCommentBox(nodeEvent)) {
                textAreaMonitor($(nodeEvent.target), config.commentMaxLen);
            }
        });
    });
}());
