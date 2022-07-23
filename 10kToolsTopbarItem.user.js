// ==UserScript==
// @name         10K Tools Topbar Button
// @description  Adds a Button to the topbar which gives a direct list to all 10k tool pages
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.4
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/10kToolsTopbarItem.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/10kToolsTopbarItem.user.js
//
// @match       *://*.askubuntu.com/*
// @match       *://*.serverfault.com/*
// @match       *://*.stackapps.com/*
// @match       *://*.stackexchange.com/*
// @match       *://*.stackoverflow.com/*
// @match       *://*.superuser.com/*
// @match       *://*.mathoverflow.net/*
//
// @exclude     *://chat.stackexchange.com/*
// @exclude     *://chat.meta.stackexchange.com/*
// @exclude     *://chat.stackoverflow.com/*
//
// @grant        GM_getValue
// @grant        GM_setValue
//
// ==/UserScript==
/* globals $, StackExchange */

(function () {
    'use strict';

    const getRepThresholds = async (siteName) => {
        const apiResponseSearchValues = [{
            'key': 'toolAccess',
            'short_description': 'Access moderator tools'
        }, {
            'key': 'siteAnalyticsAccess',
            'short_description': 'Access to site analytics'
        }];
        let repThresholds = GM_getValue(siteName);

        if (repThresholds === undefined) {
            const resData = await fetch(`https://api.stackexchange.com/2.3/privileges?key=0BXFrOWQNt8HFRYCHbjdrg((&site=${siteName}`).then((res) => {
                return res.json();
            });
            repThresholds = {};
            for (const repEntry of resData.items) {
                for (const searchEntry of apiResponseSearchValues) {
                    if (repEntry.short_description === searchEntry.short_description) {
                        repThresholds[searchEntry.key] = repEntry.reputation;
                    }
                }
            }
            GM_setValue(siteName, JSON.stringify(repThresholds));
        } else {
            repThresholds = JSON.parse(repThresholds);
        }
        return repThresholds;
    };

    const main = async () => {
        const userRep = StackExchange.options.user.rep;

        const repThresholds = await getRepThresholds(window.location.host);

        if (userRep >= repThresholds.toolAccess || StackExchange.options.user.isModerator === true) {
            const popoverId = 'tools-popover';
            const tenKToolsButtonId = 'ten-k-tools-button';

            const tenKToolsLabel = '10K Tools';

            const rowLinkClasses = 's-block-link';
            const rowLabelClasses = 'tt-capitalize';

            const topbarButton = $(`<li>
    <button id="${tenKToolsButtonId}"
            class="s-topbar--item s-btn s-btn__muted"
            aria-label="${tenKToolsLabel}"
            title="${tenKToolsLabel}"
            role="menuitem"
            aria-controls="${popoverId}"
            data-controller="s-popover"
            data-action="s-popover#toggle"
            data-s-popover-placement="bottom-end"
            data-s-popover-toggle-class="is-selected">
        <svg aria-hidden="true" class="svg-icon iconGraph" width="18" height="18" viewBox="0 0 18 18">
            <path d="M3 1h12c1.09 0 2 .91 2 2v12c0 1.09-.91 2-2 2H3c-1.09 0-2-.91-2-2V3c0-1.1.9-2 2-2Zm1 8v5h2V9H4Zm4-5v10h2V4H8Zm4 3v7h2V7h-2Z"></path>
        </svg>
        <div class="v-visible-sr">${tenKToolsLabel}</div>
    </button>
</li>`);
            const topbarDialogue = $(`<li role="presentation">
    <div class="topbar-dialog" id="${popoverId}" role="menu">
        <div class="header fw-wrap">
            <h3 class="flex--item">${tenKToolsLabel}</h3>
            <div class="flex--item fl1">
                <div class="ai-center d-flex jc-end">
                    <div class="-right">
                        <a href="https://stackoverflow.com/tools">Tools</a>
                    </div>
                    <button class="js-close-button flex--item s-btn s-btn__muted p0 ml8 d-none sm:d-block" type="button" aria-label="Close">
                        <svg aria-hidden="true" class="svg-icon iconClear" width="18" height="18" viewBox="0 0 18 18"><path d="M15 4.41 13.59 3 9 7.59 4.41 3 3 4.41 7.59 9 3 13.59 4.41 15 9 10.41 13.59 15 15 13.59 10.41 9 15 4.41Z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
        <ul class="s-menu" role="menu">
            <li class="s-menu--title" role="separator">Reports</li>
            <li role="menuitem"><a href="/tools/new-answers-old-questions" class="${rowLinkClasses}"><span class="${rowLabelClasses}">new answers to old questions</span></a></li>
            <li role="menuitem"><a href="/tools/protected-questions" class="${rowLinkClasses}"><span class="${rowLabelClasses}">protected questions</span></a></li>
            <li role="menuitem"><a href="/tools/post-feedback" class="${rowLinkClasses}"><span class="${rowLabelClasses}">anonymous and low rep post feedback</span></a></li>
            <li class="s-menu--title" role="separator">Tags</li>
            <li role="menuitem"><a href="/tags/synonyms" class="${rowLinkClasses}"><span class="${rowLabelClasses}">tag synonyms</span></a></li>
            <li role="menuitem"><a href="/tags?tab=new" class="${rowLinkClasses}"><span class="${rowLabelClasses}">new tags</span></a></li>
            <li class="s-menu--title" role="separator">Stats</li>
            <li role="menuitem"><a href="/tools/question-close-stats" class="${rowLinkClasses}"><span class="${rowLabelClasses}">question close stats</span></a></li>
            <li role="menuitem"><a href="/tools/suggested-edits" class="${rowLinkClasses}"><span class="${rowLabelClasses}">suggested edit stats</span></a></li>
            <li role="menuitem"><a href="/tools?tab=stats" class="${rowLinkClasses}"><span class="${rowLabelClasses}">stats</span></a></li>
            <li role="menuitem"><a href="/tools?tab=migrated" class="${rowLinkClasses}"><span class="${rowLabelClasses}">migrated</span></a></li>
            <li role="menuitem"><a href="/tools?tab=close" class="${rowLinkClasses}"><span class="${rowLabelClasses}">closed</span></a></li>
            <li role="menuitem"><a href="/tools?tab=delete" class="${rowLinkClasses}"><span class="${rowLabelClasses}">deleted</span></a></li>
            ${(userRep >= repThresholds.siteAnalyticsAccess || StackExchange.options.user.isModerator === true) ? `<li class="s-menu--title" role="separator">Analytics</li><li role="menuitem"><a href="/site-analytics" class="${rowLinkClasses}"><span class="${rowLabelClasses}">site analytics</span></a></li>` : ''}
        </ul>
    </div>
</li>`);

            const addStyleSheet = () => {
                const style = document.createElement('style');
                style.id = '10k-tools-topbar-styles';
                style.innerHTML = `#${popoverId}:not(.is-visible){display:none;}#${popoverId}{margin-top: -10px !important;}`;
                document.head.appendChild(style);
            };

            const addTopButton = () => {
                const mountAfter = $('#review-button').closest('li');
                mountAfter.after(topbarButton);
                topbarButton.after(topbarDialogue);
            };

            addStyleSheet();
            addTopButton();
        }
    };

    StackExchange.ready(() => {
        void main();
    });
})();