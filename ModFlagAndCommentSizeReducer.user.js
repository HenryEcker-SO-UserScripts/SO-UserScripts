// ==UserScript==
// @name         ModFlagAndCommentSizeReducer
// @description  Tries to make mod flags smaller where possible
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.0.3
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

    let ids = new Map();
    const reducers = [
        // Convert any absolute links to relative links
        {
            pattern: new RegExp(`\\[(.*)]\\((?:${window.location.origin})/([^)]+)\\)`),
            replacer: '[$1](/$2)'
        },
        // Shorten /qa/postid/userid to just /qa/postid
        {
            pattern: /\[(.*)]\(\/([qa])\/(\d+)\/(\d+)?\)/g,
            replacer: '[$1](/$2/$3)'
        },
        // Shorten /questions/postid/title to just /q/postid
        {
            pattern: /\[(.*)]\(\/questions\/(\d+)\/[^/#]+\)/g,
            replacer: '[$1](/q/$2)'
        },
        // Shorten /questions/questionid/title/answerid#answerid to just /a/answerid
        {
            pattern: /\[(.*)]\(\/questions\/\d+\/[^/]+\/(\d+)#\d+\)/g,
            replacer: '[$1](/a/$2)'
        },
        // Auto-Enumerate any bare post links
        {
            pattern: new RegExp(`(?:(?<!]\\())(?:${window.location.origin})/([qa])\\/(\\d+)(?:\\/\\d+)?`, 'g'),
            replacer: (sub, p1, p2) => {
                if (!ids.has(p2)) {
                    ids.set(p2, Math.max(0, ...ids.values()) + 1);
                }
                return `[${ids.get(p2)}](/${p1}/${p2})`;
            }
        },
        // Shorten /questions/postid/title#comment[commentid]_[postid] to just /posts/comments/commentid
        {
            pattern: /\[(.*)]\(\/questions\/\d+(?:\/[^/]+|\/[^/]+\/\d+)#comment(\d+)_\d+\)/g,
            replacer: '[$1](/posts/comments/$2)'
        },
        // Shorten /users/userid/uname to /users/userid
        {
            pattern: /\[(.*)]\(\/users\/(\d+)\/[^/#]+\)/g,
            replacer: '[$1](/users/$2)'
        }
    ];

    const posTrackingReplace = (pattern, text, replacer, pos) => {
        let sLength = text.length;
        // Replace Text
        text = text.replace(pattern, replacer);
        // Assumes pattern always reduces size (which is the point)
        pos = Math.max(0, pos - (sLength - text.length));
        // Return the string and the updated position
        return [text, pos];
    };

    const patternReducer = (text, pos) => {
        return reducers.reduce(
            (
                [newText, newPos], reducer
            ) => posTrackingReplace(reducer.pattern, newText, reducer.replacer, newPos),
            [text, pos]
        );
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

    const textAreaMonitor = (textArea, cb = undefined) => {
        if (textArea.attr(selectors.attrs.monitoredTextArea) !== true) { // prevent adding the listener multiple times
            textArea.on('input propertychange', (ev) => {
                const [reducedText, selectionStart] = patternReducer(ev.target.value, ev.target.selectionStart);
                ev.target.value = reducedText;
                // Fix Cursor Position
                ev.target.selectionStart = selectionStart;
                ev.target.selectionEnd = selectionStart;

                // Optionally do something else with reducedText and selectionStart
                if (cb) cb(reducedText, selectionStart);
            });
            textArea.attr('data-mfacsr-monitored', true);
        }
    };

    StackExchange.ready(() => {
        let flagText = undefined; // Keep flag text (fragile save)
        $(document).on('DOMNodeInserted', (nodeEvent) => {
            if (testIsFlagPopup(nodeEvent)) {
                const textArea = $('textarea[name="otherText"]');

                textAreaMonitor(textArea, (reducedText) => {
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
                textAreaMonitor($(nodeEvent.target));
            }
        });
    });
}());