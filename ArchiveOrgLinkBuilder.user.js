// ==UserScript==
// @name         Archive.org Link Builder
// @description  Adds a button which converts post links into archive.org links (links still need to be checked for validity)
// @homepage     https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.2
// @downloadURL  https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/ArchiveOrgLinkBuilder.user.js
// @updateURL    https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/ArchiveOrgLinkBuilder.user.js
//
// @match        *://*.askubuntu.com/questions/*
// @match        *://*.serverfault.com/questions/*
// @match        *://*.stackapps.com/questions/*
// @match        *://*.stackexchange.com/questions/*
// @match        *://*.stackoverflow.com/questions/*
// @match        *://*.superuser.com/questions/*
// @match        *://*.mathoverflow.net/questions/*
//
// ==/UserScript==
/* globals $, StackExchange */

(function () {
    'use strict';

    const config = {
        votingContainerSelector: '.js-voting-container',
        timelineLinkSelector: 'a[href$="/timeline"]',
        postLayoutSelector: '.post-layout',
        postCreationDateSelector: 'time[itemprop="dateCreated"]',
        proseLinkSelector: '.s-prose a',
        votingContainerButtonClasses: 'flex--item s-btn s-btn__unset c-pointer py6 mx-auto',
        archiveButtonIcon: '<svg aria-hidden="true" class="svg-icon iconArchiveSm" width="14" height="14" viewBox="0 0 14 14"><path d="M1 3c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2H1Zm11 1H2v7c0 1.1.9 2 2 2h6a2 2 0 0 0 2-2V4ZM4.5 6h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1Z"></path></svg>'
    };

    const dFormat = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const convertDateToArchiveOrgLinkFormat = (d) => {
        const parts = dFormat.formatToParts(d);
        return `${parts[4].value}${parts[2].value}${parts[0].value}`;
    };

    const getPageCreationDates = () => {
        // Get all time elements in the page
        // time elements are not embedded in all posts
        // questions have it in the question header, so it's just easier to parse them all up front
        return $(config.postCreationDateSelector).map((i, n) => {
            return convertDateToArchiveOrgLinkFormat(new Date($(n).attr('datetime')));
        }).toArray();
    };

    const buildArchiveButtonAndPopover = (e, postId, archiveOrgDate) => {
        const stacksTooltip = `--stacks-s-tooltip-aolb-${postId}`;

        const popover = $(`<div id="${stacksTooltip}" class="s-popover s-popover__tooltip wmx2" role="tooltip">Build archive.org links from post links using post creation date.<div class="s-popover--arrow" style=""></div></div>`);
        popover.insertAfter(e);

        const a = $(`<a href="#" class="${config.votingContainerButtonClasses}" data-controller="s-tooltip" data-s-tooltip-placement="right" aria-label="Archive.org Links" aria-describedby="${stacksTooltip}">${config.archiveButtonIcon}</a>`);
        a.insertAfter(e);

        a.on('click', (ev) => {
            ev.preventDefault();
            const links = e.closest(config.postLayoutSelector).find(config.proseLinkSelector);

            if (links.length === 0) {
                StackExchange.helpers.showToast('There are no links in this post to convert.', {
                    type: 'danger',
                    transient: true,
                    transientTimeout: 2000
                });
                return;
            }


            void StackExchange.helpers.showConfirmModal({
                title: 'Archive Links',
                bodyHtml: $('<ol style="word-break:break-all"></ol>').append(
                    ...links.map((i, n) => {
                        const originalHref = $(n).attr('href');
                        if (originalHref.includes('web.archive.org/web/')) {
                            return undefined;
                        }
                        const href = `https://web.archive.org/web/${archiveOrgDate}/${originalHref}`;
                        return `<li><a href="${href}" target="_blank">${href}</a></li>`;
                    })
                ),
                buttonLabel: 'Done'
            });
        });
    };


    const main = () => {
        const creationDates = getPageCreationDates();
        $(`${config.votingContainerSelector} ${config.timelineLinkSelector}`).each((i, n) => {
            const e = $(n);
            const postId = e.closest(config.votingContainerSelector).attr('data-post-id');
            buildArchiveButtonAndPopover(e, postId, creationDates[i]);
        });
    };

    // Run Script
    main();
})();