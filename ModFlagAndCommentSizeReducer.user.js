// ==UserScript==
// @name         ModFlagAndCommentSizeReducer
// @description  Tries to make mod flags and comments smaller where possible
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.1.0
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

    const textAreaMaxLens = {
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

    const bareDomainLink = new RegExp(`(?<!]\\()${window.location.origin}(\\/[\\w-#%?=]+)+`, 'g');
    const absoluteLinkPattern = new RegExp(`\\[(.*?)]\\((?:${window.location.origin})/([^)]+)\\)`);

    const reducerTiers = [
        // Tier One Reducers
        [
            // Convert any bare link
            (s) => {
                return s.replace(bareDomainLink, (sub) => {
                    return `[1](${sub})`;
                });
            },
            // Convert any absolute links to relative links
            (s) => {
                return s.replace(absoluteLinkPattern, '[$1](/$2)');
            },
            // Shorten /questions/postId/title to just /q/postId
            (s) => {
                return s.replace(/\[(.*?)]\(\/questions\/(\d+)\/[^/#]+\)/g, '[$1](/q/$2)');
            },
            // Shorten /questions/questionId/title/answerId#answerId to just /a/answerId
            (s) => {
                return s.replace(/\[(.*?)]\(\/questions\/\d+\/.+?#\d+\)/g, '[$1](/a/$2)');
            },
            // Shorten /questions/postId/title#comment[commentId]_[postId] to just /posts/comments/commentId
            (s) => {
                return s.replace(/\[(.*?)]\(\/questions\/\d+\/.+?#comment(\d+)_\d+\)/g, '[$1](/posts/comments/$2)');
            },
            // Shorten /users/userid/uname to /users/userid
            (s) => {
                return s.replace(/\[(.*?)]\(\/users\/(\d+)\/[^?]+(\?tab=.+?)?\)/g, (sub, p1, p2, p3) => {
                    if (p3 === undefined || p3 === '?tab=profile') { // profile tab is default
                        return `[${p1}](/users/${p2})`;
                    }
                    return `[${p1}](/users/${p2}${p3})`;
                });
            },
            //----- BARE LINK ENUMERATION ------//
            // Convert any post links from [1](/qa/postId/userid) to [QA1](/qa/postId/userid)
            (s) => {
                return s.replace(/\[\d+]\(\/([qa])\/(\d+)(\/(\d+))?\)/g, (sub, p1, p2, p3) => {
                    return `[${p1.toUpperCase()}1](/${p1}/${p2}${p3 || ''})`;
                });
            },
            // Convert any review links from [1](/review/queueName/reviewId) to [R1](/review/queueName/reviewId)
            (s) => {
                return s.replace(/\[1]\((\/review\/.+?\/\d+)\)/g, '[R1]($1)');
            },
            // Convert any comment links from [1](/posts/comments/commentId) to [C1](/posts/comments/commentId)
            (s) => {
                return s.replace(/\[1]\((\/posts\/comments\/\d+)\)/g, '[C1]($1)');
            },
            // Convert any user links from [1](/users/userId) to [U1](/users/userId)
            (s) => {
                return s.replace(/\[1]\((\/users\/\d+)\)/g, '[U1]($1)');
            },
            // Enumerate numbered links prefixed with link type (QARCU) (Goes back through to renumber any existing short-links when needed)
            (s) => {
                const ids = {};
                return s.replace(/\[([QARCU])\d+]\((\/.+?)\)/g, (sub, p1, p2) => {
                    if (!(p1 in ids)) {
                        ids[p1] = new Map();
                        ids[p1].set(p2, 1);
                    } else if (!ids[p1].has(p2)) {
                        ids[p1].set(p2, Math.max(0, ...ids[p1].values()) + 1);
                    }
                    return `[${p1}${ids[p1].get(p2)}](${p2})`;
                });
            }
        ],
        // Tier Two Reducers
        [
            // Shorten /qa/postId/userid to just /qa/postId
            (s) => {
                return s.replace(/\[(.*?)]\(\/([qa])\/(\d+)\/(\d+)?\)/g, '[$1](/$2/$3)');
            }
        ],
        // Tier Three Reducers
        [
            // Further shorten the enumerated links by removing the link type prefix letter and re-enumerating
            (s) => {
                const idMap = new Map();
                return s.replace(/\[[QARCU]?\d+]\((\/.+?)\)/g, (sub, p1) => {
                    if (!idMap.has(p1)) {
                        idMap.set(p1, Math.max(0, ...idMap.values()) + 1);
                    }
                    return `[${idMap.get(p1)}](${p1})`;
                });
            }
        ]
    ];

    const patternReducer = (reducers, text, pos) => {
        return reducers.reduce((
            [newText, newPos], reducer
        ) => {
            const sLength = newText.length;
            // Replace Text
            newText = reducer(newText);
            // Assumes pattern always reduces size (which is the point)
            newPos = Math.max(0, newPos - (sLength - newText.length));
            // Return the string and the updated position
            return [newText, newPos];
        }, [text, pos]);
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
                    [reducedText, selectionStart] = patternReducer(reducers, reducedText, selectionStart);
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
                if (cb) {
                    cb(reducedText, selectionStart);
                }
            });
            textArea.attr(selectors.attrs.monitoredTextArea, true);
        }
    };

    StackExchange.ready(() => {
        let flagText = undefined; // Keep flag text (fragile save)
        $(document).on('DOMNodeInserted', (nodeEvent) => {
            if (testIsFlagPopup(nodeEvent)) {
                const textArea = $('textarea[name="otherText"]');

                textAreaMonitor(textArea, textAreaMaxLens.postFlagMaxLen, (reducedText) => {
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
                textAreaMonitor($(nodeEvent.target), textAreaMaxLens.commentMaxLen);
            }
        });
    });
}());
