// ==UserScript==
// @name         ModFlagAndCommentSizeReducer
// @description  Tries to make mod flags and comments smaller where possible
// @homepage     https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.2.3
// @downloadURL  https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/ModFlagAndCommentSizeReducer.user.js
// @updateURL    https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/ModFlagAndCommentSizeReducer.user.js
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
// @exclude      *://*askubuntu.com/questions/ask*
// @exclude      *://*mathoverflow.net/questions/ask*
// @exclude      *://*serverfault.com/questions/ask*
// @exclude      *://*stackapps.com/questions/ask*
// @exclude      *://*stackexchange.com/questions/ask*
// @exclude      *://*stackoverflow.com/questions/ask*
// @exclude      *://*superuser.com/questions/ask*
//
// @grant        none
//
// ==/UserScript==
/* globals StackExchange, $ */

(function () {
    'use strict';
    // Relies on RegisterTextareaReducer having registered the stacks controller

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

    const testIsFlagPopup = ($node) => {
        return (
            $node.hasClass(selectors.css.flagDialoguePopupClass) && // Popup added
            $node.attr('id') === selectors.ids.flagDialogue // Check is Flag popup
        );
    };

    const testIsCommentFlagPopup = ($node) => {
        return (
            $node.hasClass(selectors.css.commentFlagDialoguePopupClass) &&
            $node.attr('id') === selectors.ids.commentFlagDDialogue
        );
    };

    const testIsCommentBox = ($node) => {
        return (
            $node.is(selectors.jquerySelector.commentTextArea)
        );
    };


    const addDataAttributesToTextarea = (textarea) => {
        textarea.attr('data-action', 'uhtr-size-reducer#handleReduceAction');
        textarea.attr('data-controller', 'uhtr-size-reducer');
    };


    StackExchange.ready(() => {
        const attachDOMNodeListenerToButton = (evaluateNode, action) => {
            return (ev) => {
                ev.preventDefault();
                const domObserver = new MutationObserver((mutationList, mutationObserver) => {
                    for (const mutation of mutationList) {
                        for (const node of mutation.addedNodes) {
                            const $node = $(node);
                            if (evaluateNode($node)) {
                                action($node);
                                // Remove Observer since we've found the node we want
                                mutationObserver.disconnect();
                                return;
                            }
                        }
                    }
                });
                domObserver.observe(document.body, {childList: true, subtree: true});
            };
        };

        // Add comment textarea listener to add comment  buttons
        $(selectors.jquerySelector.addCommentButton).on(
            'click',
            attachDOMNodeListenerToButton(
                testIsCommentBox,
                ($node) => {
                    addDataAttributesToTextarea(
                        $node
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
                        $(selectors.jquerySelector.postFlagDialogue.textArea)
                    );
                }
            )
        );


        // Add comment flag listener to comment flag buttons
        $(selectors.jquerySelector.flagButtons.commentFlag).on(
            'click',
            attachDOMNodeListenerToButton(
                testIsCommentFlagPopup,
                ($node) => {
                    addDataAttributesToTextarea(
                        $node.find(selectors.jquerySelector.commentFlagDialogue.textArea)
                    );
                }
            )
        );
    });
}());