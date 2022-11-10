// ==UserScript==
// @name         Filter Delete Review Actions in LA
// @description  Only shows Delete and Recommend Deletion actions (for posts which are not deleted)
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.9
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
        styles: {visitedStyle: 'bg-red-500'},
        maxOpen: 6
    };

    const goToNextPage = () => {
        const href = $('a[rel="next"]').attr('href');
        window.location.assign(href);
    };

    const goToPrevPage = () => {
        const href = $('a[rel="prev"]').attr('href');
        window.location.assign(href);
    };

    const openLinks = (autoNext = false) => {
        const links = $(config.selector.rowSelector).find(`td:eq(2) a:not(.${config.styles.visitedStyle})`);
        for (const e of links.slice(0, config.maxOpen)) {
            window.open(e.getAttribute('href'), '_blank');
            $(e).addClass(config.styles.visitedStyle);
        }
        if (autoNext && links.length <= config.maxOpen) {
            goToNextPage();
        }
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

            const button = $(`<button class="s-btn s-btn__xs s-btn__outlined ml6" title="Open up to ${config.maxOpen} unvisited review tasks in new tabs">Open up to ${config.maxOpen}</button>`);
            button.on('click', (ev) => {
                ev.preventDefault();
                openLinks(false);
            });
            $('#content table tr:eq(0) th:eq(2)').append(button);


            document.addEventListener('keydown', (ev) => {
                if (ev.key === 'x') {
                    openLinks(true);
                } else if (ev.key === 'X') {
                    goToNextPage();
                } else if (ev.key === 'z') {
                    goToPrevPage();
                } else if (ev.key === 'n') {
                    button.click();
                }
            });
        } else if (window.location.pathname.match(/^\/review\/late-answers\/\d+$/)) {
            const openFlagDialogue = () => {
                $('#answer .js-flag-post-link').click();
            };
            document.addEventListener('keydown', (ev) => {
                if ($('#popup-flag-post').length === 0) {
                    if (ev.key === 'f' && !ev.ctrlKey) {
                        openFlagDialogue();
                    }
                }
            });
        }
    });
})();