// ==UserScript==
// @name         ModFlagAndCommentSizeReducer
// @description  Tries to make mod flags and comments smaller where possible
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.2.0
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/ModFlagAndCommentSizeReducer.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/ModFlagAndCommentSizeReducer.user.js
//
// @match        *://*.askubuntu.com/questions/*
// @match        *://*.serverfault.com/questions/*
// @match        *://*.stackapps.com/questions/*
// @match        *://*.stackexchange.com/questions/*
// @match        *://*.stackoverflow.com/questions/*
// @match        *://*.superuser.com/questions/*
// @match        *://*.mathoverflow.net/questions/*
//
// @match        *://*.askubuntu.com/review/*
// @match        *://*.serverfault.com/review/*
// @match        *://*.stackapps.com/review/*
// @match        *://*.stackexchange.com/review/*
// @match        *://*.stackoverflow.com/review/*
// @match        *://*.superuser.com/review/*
// @match        *://*.mathoverflow.net/review/*
//
// @exclude      *://*.askubuntu.com/questions/ask*
// @exclude      *://*.mathoverflow.net/questions/ask*
// @exclude      *://*.serverfault.com/questions/ask*
// @exclude      *://*.stackapps.com/questions/ask*
// @exclude      *://*.stackexchange.com/questions/ask*
// @exclude      *://*.stackoverflow.com/questions/ask*
// @exclude      *://*.superuser.com/questions/ask*
//
// @grant        none
//
// ==/UserScript==
/* globals StackExchange, $, Stacks */

(function () {
    'use strict';

    const textAreaMaxLens = {
        postFlagMaxLen: 500,
        commentFlagMaxLen: 500,
        commentMaxLen: 600
    };

    const selectors = {
        jquerySelector: {
            addCommentButton: '.js-add-link.comments-link',
            editCommentButton: '.js-comment-edit',
            commentTextArea: 'textarea.s-textarea.js-comment-text-input',
            commentFlagDialogue: {
                textArea: 'textarea.s-textarea',
                inputButton: 'input#comment-flag-type-CommentOther'
            },
            postFlagDialogue: {
                textArea: 'textarea[name="otherText"]',
                inputButton: 'input[value="PostOther"]'
            },
            flagButtons: {
                postFlag: '.js-flag-post-link.s-btn',
                commentFlag: '.js-comment-flag.s-btn'
            }
        },
        css: {
            flagDialoguePopupClass: 'popup',
            commentFlagDialoguePopupClass: 's-modal'
        },
        ids: {
            flagDialogue: 'popup-flag-post',
            commentFlagDDialogue: 'modal-base',
            reduceButton: 'mfacsr-reduce-pattern-btn'
        },
        attrs: {
            monitoredTextArea: 'data-mfacsr-monitored'
        }
    };
    const data = {
        controller: 'tasr-size-reducer',
        target: {
            textField: 'text-field'
        },
        info: {
            newRows: 'new-rows'
        },
        param: {
            reducerPattern: 'reducer-pattern',
            maxLen: 'field-max-length'
        },
        action: {
            handleUpdate: 'handleReduceTextContent'
        }
    };

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
                if (p3 === undefined || p3 === '?tab=profile') { // profile tab is default
                    return `[${p1}](/users/${p2})`;
                }
                return `[${p1}](/users/${p2}${p3})`;
            });
        }
    ];

    const bareDomainLink = new RegExp(`(?<!]\\()${window.location.origin}(\\/[\\w#$&+/=?@\\-%]+)`, 'g');
    const bareLinkReducer = (s) => {
        return s.replace(bareDomainLink, (sub) => {
            return `[1](${sub})`;
        });
    };
    const enumerationReducers = [
        //----- BARE LINK ENUMERATION ------//,
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
    ];

    // Shorten /qa/postId/userid to just /qa/postId
    const stripUserIdFromQAReducer = (s) => {
        return s.replace(/\[(.*?)]\(\/([qa])\/(\d+)\/\d+\)/g, '[$1](/$2/$3)');
    };

    // Further shorten the enumerated links by removing the link type prefix letter and re-enumerating
    const removeEnumerationPrefixReducer = (s) => {
        const idMap = new Map();
        return s.replace(/\[[QARCU]?\d+]\((\/.+?)\)/g, (sub, p1) => {
            if (!idMap.has(p1)) {
                idMap.set(p1, Math.max(0, ...idMap.values()) + 1);
            }
            return `[${idMap.get(p1)}](${p1})`;
        });
    };

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
            $(nodeEvent.target).attr('id') === selectors.ids.flagDialogue // Check is Flag popup
        );
    };

    const testIsCommentFlagPopup = (nodeEvent) => {
        return (
            $(nodeEvent.target).hasClass(selectors.css.commentFlagDialoguePopupClass) &&
            $(nodeEvent.target).attr('id') === selectors.ids.commentFlagDDialogue
        );
    };

    const testIsCommentBox = (nodeEvent) => {
        return (
            $(nodeEvent.target).is(selectors.jquerySelector.commentTextArea)
        );
    };

    const handleReduceText = (reducedText, reducerTiers, maxLen, selectionStart) => {
        for (const reducers of reducerTiers) {
            [reducedText, selectionStart] = patternReducer(reducers, reducedText, selectionStart);
            // If reducedText is under maxLen stop reducing
            if (reducedText.length <= maxLen) {
                break;
            }
        }
        return reducedText;
    };

    const addDataAttributesToTextarea = (textarea, reducerType, maxLen, rows) => {
        if (rows !== undefined) {
            textarea.attr(`data-${data.info.newRows}`, rows);
        }
        textarea.attr(`data-${data.controller}-target`, data.target.textField);
        textarea.attr(`data-${data.controller}-${data.param.reducerPattern}-param`, reducerType);
        textarea.attr(`data-${data.controller}-${data.param.maxLen}-param`, maxLen);
        textarea.attr('data-action', `input->${data.controller}#${data.action.handleUpdate}`);
        textarea.attr('data-controller', data.controller);
    };

    const addStacksController = () => {
        Stacks.addController(
            data.controller,
            {
                targets: [data.target.textField],
                connect() {
                    const newRows = this[`${data.target.textField}Target`].getAttribute('data-new-rows');
                    if (newRows !== undefined) {
                        this[`${data.target.textField}Target`].setAttribute('rows', newRows);
                    }
                },
                flagReducerTiers: [
                    // Tier One Reducers
                    [...shortestRelativeLinkReducer, stripUserIdFromQAReducer],
                    [bareLinkReducer, ...shortestRelativeLinkReducer, ...enumerationReducers],
                    [removeEnumerationPrefixReducer]
                ],
                commentReducerTiers: [
                    // Tier One Reducers
                    [...shortestRelativeLinkReducer],
                    [bareLinkReducer, ...shortestRelativeLinkReducer, ...enumerationReducers],
                    [stripUserIdFromQAReducer]
                ],
                [data.action.handleUpdate](ev) {
                    const selectionStart = ev.target.selectionStart;
                    const {reducerPattern, fieldMaxLength} = ev.params;
                    ev.target.value = handleReduceText(ev.target.value, this[reducerPattern], fieldMaxLength, selectionStart);
                    // Fix Cursor Position
                    ev.target.selectionStart = selectionStart;
                    ev.target.selectionEnd = selectionStart;
                }
            }
        );
    };


    StackExchange.ready(() => {
        addStacksController();

        const attachDOMNodeListenerToButton = (evaluateNode, action) => {
            return (ev) => {
                ev.preventDefault();
                $(document).on('DOMNodeInserted', (nodeEvent) => {
                    if (evaluateNode(nodeEvent)) {
                        action(nodeEvent);
                        // Remove Listener since we've found the node we want
                        $(document).off('DOMNodeInserted');
                    }
                });
            };
        };

        // Add comment textarea listener to add comment  buttons
        $(selectors.jquerySelector.addCommentButton).on(
            'click',
            attachDOMNodeListenerToButton(
                testIsCommentBox,
                (nodeEvent) => {
                    addDataAttributesToTextarea(
                        $(nodeEvent.target),
                        'commentReducerTiers',
                        textAreaMaxLens.commentMaxLen
                    );
                })
        );

        // Add post flag listener to post flag buttons
        $(selectors.jquerySelector.flagButtons.postFlag).on(
            'click',
            attachDOMNodeListenerToButton(
                testIsFlagPopup,
                () => {
                    addDataAttributesToTextarea(
                        $(selectors.jquerySelector.postFlagDialogue.textArea),
                        'flagReducerTiers',
                        textAreaMaxLens.postFlagMaxLen,
                        9
                    );
                }
            )
        );


        // Add comment flag listener to comment flag buttons
        $(selectors.jquerySelector.flagButtons.commentFlag).on(
            'click',
            attachDOMNodeListenerToButton(
                testIsCommentFlagPopup,
                (nodeEvent) => {
                    addDataAttributesToTextarea(
                        $(nodeEvent.target).find(selectors.jquerySelector.commentFlagDialogue.textArea),
                        'flagReducerTiers',
                        textAreaMaxLens.commentFlagMaxLen
                    );
                }
            )
        );
    });
}());