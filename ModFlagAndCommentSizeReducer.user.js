// ==UserScript==
// @name         ModFlagAndCommentSizeReducer
// @description  Tries to make mod flags and comments smaller where possible
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.0.6
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
    const absoluteLinkPattern = new RegExp(`\\[(.*?)]\\((?:${window.location.origin})/([^)]+)\\)`);
    const barePostLinkPattern = new RegExp(`(?<!]\\()${window.location.origin}\\/([qa])\\/(\\d+)(\\/\\d+)?`, 'g');
    const bareReviewLinkPattern = new RegExp(`(?<!]\\()${window.location.origin}(\\/review\\/.+?\\/\\d+)`, 'g');

    const enumeratedLinkPattern = /\[([QAR])\d+]\((\/.+?)\)/g;
    const reducerTiers = [
        // Tier One Reducers
        [
            // Convert any absolute links to relative links
            (s) => {
                return s.replace(absoluteLinkPattern, '[$1](/$2)');
            },
            // Shorten /questions/postid/title to just /q/postid
            (s) => {
                return s.replace(/\[(.*?)]\(\/questions\/(\d+)\/[^/#]+\)/g, '[$1](/q/$2)');
            },
            // Shorten /questions/questionid/title/answerid#answerid to just /a/answerid
            (s) => {
                return s.replace(/\[(.*?)]\(\/questions\/\d+\/[^/]+\/(\d+)#\d+\)/g, '[$1](/a/$2)');
            },
            // Convert any bare post links to [1](/qa/postid/userid)
            (s) => {
                return s.replace(barePostLinkPattern, (sub, p1, p2, p3) => {
                    return `[${p1.toUpperCase()}1](/${p1}/${p2}${p3})`;
                });
            },
            // Convert any bare review links to [1](/review/queueName/reviewId)
            (s) => {
                return s.replace(bareReviewLinkPattern, '[R1]($1)');
            },
            // Enumerate numbered links prefixed with QAR (Goes back through to renumber any existing short-links when needed)
            (s) => {
                const ids = {};
                return s.replace(enumeratedLinkPattern, (sub, p1, p2) => {
                    if (!(p1 in ids)) {
                        ids[p1] = new Map();
                        ids[p1].set(p2, 1);
                    } else if (!ids[p1].has(p2)) {
                        ids[p1].set(p2, Math.max(0, ...ids[p1].values()) + 1);
                    }
                    return `[${p1}${ids[p1].get(p2)}](${p2})`;
                });
            },
            // Shorten /questions/postid/title#comment[commentid]_[postid] to just /posts/comments/commentid
            (s) => {
                return s.replace(/\[(.*?)]\(\/questions\/\d+(?:\/[^/]+|\/[^/]+\/\d+)#comment(\d+)_\d+\)/g, '[$1](/posts/comments/$2)');
            },
            // Shorten /users/userid/uname to /users/userid
            (s) => {
                return s.replace(/\[(.*?)]\(\/users\/(\d+)\/[^/#]+\)/g, '[$1](/users/$2)');
            }
        ],
        // Tier Two Reducers
        [
            // Shorten /qa/postid/userid to just /qa/postid
            (s) => {
                return s.replace(/\[(.*?)]\(\/([qa])\/(\d+)\/(\d+)?\)/g, '[$1](/$2/$3)');
            },
            // Further shorten enumerated links by removing the link type prefix letter and re-enumerating
            (s) => {
                const idMap = new Map();
                return s.replace(enumeratedLinkPattern, (sub, p1) => {
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
