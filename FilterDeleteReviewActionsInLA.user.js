// ==UserScript==
// @name         Filter Delete Review Actions in LA
// @description  Only shows Delete and Recommend Deletion actions (for posts which are not deleted)
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.7
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/FilterDeleteReviewActionsInLA.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/FilterDeleteReviewActionsInLA.user.js
//
// @match        *://stackoverflow.com/review/late-answers/*
//
// @grant        none
//
// ==/UserScript==
/* globals  $, StackExchange */


(function () {
    'use strict';

    const config = {
        selector: {rowSelector: '#content table tr:gt(0)'},
        styles: {visitedStyle: 'bg-red-500'}
    };

    StackExchange.ready(() => {
        if (window.location.pathname.endsWith('/history')) {
            $(config.selector.rowSelector).filter((i, n) => {
                const e = $(n);
                const action = e.find('td:eq(2)');

                // Make link modifications
                const link = action.find('a');
                link.attr('target', '_blank');
                link.on('mousedown', () => {
                    // Keep track of which links have already been clicked
                    link.addClass(config.styles.visitedStyle);
                });

                const actionText = action.text().trim().toLowerCase();
                const isDeleted = e.find('.iconTrashSm').length > 0;
                return isDeleted || !actionText.contains('delet');
            }).remove();

            const button = $('<button class="s-btn s-btn__xs s-btn__outlined ml6" title="Open all unvisited review tasks in new tabs">Open All</button>');
            button.on('click', (ev) => {
                ev.preventDefault();
                for (const e of $(config.selector.rowSelector).find(`td:eq(2) a:not(.${config.styles.visitedStyle})`)) {
                    window.open(e.getAttribute('href'), '_blank');
                    $(e).addClass(config.styles.visitedStyle);
                }
            });
            $('#content table tr:eq(0) th:eq(2)').append(button);


            document.addEventListener('keydown', (ev) => {
                if (ev.key === 'x') {
                    const href = $('a[rel="next"]').attr('href');
                    window.location.assign(href);
                } else if (ev.key === 'z') {
                    const href = $('a[rel="prev"]').attr('href');
                    window.location.assign(href);
                } else if (ev.key === 'n') {
                    button.click();
                }
            });
        } else if (window.location.pathname.match(/^\/review\/late-answers\/\d+$/)) {
            const openFlagDialogue = () => {
                $('#answer .js-flag-post-link').click();
            };
            document.addEventListener('keydown', (ev) => {
                if (ev.key === 'f') {
                    openFlagDialogue();
                }
            });
        }
    });
})();