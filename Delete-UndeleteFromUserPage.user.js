// ==UserScript==
// @name         Inline delete/undelete buttons user pages
// @description  Adds delete/undelete buttons on the questions and answers tabs in user page
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.3
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/Delete-UndeleteFromUserPage.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/Delete-UndeleteFromUserPage.user.js
//
// @match        *://*.stackoverflow.com/users/*/*?tab=answers*
// @match        *://*.stackoverflow.com/users/*/*?tab=questions*
//
// @grant        none
//
// ==/UserScript==
/* globals StackExchange, $ */

(function () {
    'use strict';

    const config = {
        deleteVoteCode: 10,
        undeleteVoteCode: 11,
        userFkey: StackExchange.options.user.fkey
    };

    const getFormDataFromObject = (obj) => {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            acc.set(key, value);
            return acc;
        }, new FormData());
    };

    const castVote = (postId, voteType, successCb) => {
        void fetch(`//${window.location.hostname}/posts/${postId}/vote/${voteType}`, {
            method: 'POST',
            body: getFormDataFromObject({fkey: config.userFkey})
        }).then(successCb);
    };

    // Build a button element depending on if the post is deleted or undeleted
    const makeButton = (btnType, postId, jSummary, jSummaryParent) => {
        const btn = $('<button class="s-btn ml-auto s-btn__outlined"></button>');
        if (btnType === 'undelete') {
            btn.text('Undelete');
            btn.on('click', undeleteBtnClickHandler(postId, jSummary, jSummaryParent, btn));
        } else {
            btn.text('Delete');
            btn.addClass('s-btn__danger');
            btn.on('click', deleteBtnClickHandler(postId, jSummary, jSummaryParent, btn));
        }
        return btn;
    };

    // Make a click handler for the btn;
    const makeBtnClickHandler = (postId, voteType, newBtnType, jSummary, jSummaryParent, btn, operation) => {
        return (ev) => {
            ev.preventDefault();
            castVote(
                postId,
                voteType,
                (res) => {
                    if (res.status === 200) {
                        // Do something to change the style of the divs
                        operation(jSummary, jSummaryParent);
                        // Replace with a new button
                        btn.replaceWith(
                            makeButton(
                                newBtnType,
                                postId,
                                jSummary,
                                jSummaryParent
                            )
                        );
                    }
                }
            );
        };
    };


    // Changes to update styles
    const makeUndeletedStyles = (jSummary, jSummaryParent) => {
        jSummaryParent.removeClass('s-post-summary__deleted');
        jSummaryParent.find('.s-post-summary--stats-item.is-deleted').remove();
    };


    const makeDeletedStyles = (jSummary, jSummaryParent) => {
        jSummaryParent.addClass('s-post-summary__deleted');
        jSummary.prepend($(`<div class="s-post-summary--stats-item is-deleted">
                            <svg aria-hidden="true" class="svg-icon iconTrashSm" width="14" height="14" viewBox="0 0 14 14">
                                <path d="M11 2a1 1 0 0 1 1 1v1H2V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h2Zm0 3H3v6c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V5Z"/>
                            </svg>Deleted</div>`));

    };

    // Specific Click Handlers
    const undeleteBtnClickHandler = (postId, jSummary, jSummaryParent, btn) => {
        return makeBtnClickHandler(postId, config.undeleteVoteCode, 'delete', jSummary, jSummaryParent, btn, makeUndeletedStyles);
    };

    const deleteBtnClickHandler = (postId, jSummary, jSummaryParent, btn) => {
        return makeBtnClickHandler(postId, config.deleteVoteCode, 'undelete', jSummary, jSummaryParent, btn, makeDeletedStyles);
    };


    const main = () => {
        // Add btns to each post
        for (const summary of $('.s-post-summary--stats.js-post-summary-stats')) {
            const jSummary = $(summary);
            const jSummaryParent = jSummary.parent();
            const isPostDeleted = jSummaryParent.hasClass('s-post-summary__deleted');
            jSummary.append(
                makeButton(
                    isPostDeleted ? 'undelete' : 'delete',
                    jSummaryParent.attr('data-post-id'),
                    jSummary,
                    jSummaryParent
                )
            );
        }
    };

    StackExchange.ready(() => {
        main();
        // Restore buttons on tab navigation;
        $(document).on('ajaxComplete', (_0, _1, {url}) => {
            if (url.match(/users\/tab\/\d+\?tab=(answers|questions)/gi)) {
                main();
            }
        });
    });
}());