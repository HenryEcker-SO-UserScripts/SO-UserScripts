// ==UserScript==
// @name         10K Tools Topbar Button
// @description  Adds a Button to the topbar which gives a direct list to all 10k tool pages
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.7
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
// @exclude     *://area51*.stackexchange.com/
//
// @grant        GM_getValue
// @grant        GM_setValue
//
// ==/UserScript==
/* globals $, StackExchange */

(function () {
    'use strict';


    const config = {
        id: {
            popover: 'tools-popover',
            tenKToolsButton: 'ten-k-tools-button'
        },
        label: {
            tenKToolsLabel: 'Moderator Tools'
        },
        css: {
            menuLink: 's-block-link tt-capitalize'

        },
        access: {
            tools: 'toolAccess',
            siteAnalytics: 'siteAnalyticsAccess'
        }
    };

    const getRepThresholds = async (siteName) => {
        const apiResponseSearchValues = [{
            'key': config.access.tools,
            'short_description': 'Access moderator tools'
        }, {
            'key': config.access.siteAnalytics,
            'short_description': 'Access to site analytics'
        }];

        if (StackExchange.options.user.isModerator === true) {
            // There is no rep requirement for mods so set access threshold to the minimum rep (1)
            return Object.keys(apiResponseSearchValues).reduce((acc, k) => {
                return {...acc, [k]: 1};
            }, {});
        }

        let repThresholds = GM_getValue(siteName);

        if (repThresholds === undefined) {
            const resData = await fetch(
                `https://api.stackexchange.com/2.3/privileges?key=0BXFrOWQNt8HFRYCHbjdrg((&site=${siteName}`
            ).then((res) => {
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

        const repThresholds = await getRepThresholds(
            StackExchange.options.site.isChildMeta === true ?
                // Map child meta's to parent's for reputation (prevent unnecessary duplicate entries)
                new URL(StackExchange.options.site.parentUrl).host :
                window.location.host
        );

        if (userRep >= repThresholds[config.access.tools]) {
            const topbarButton = $(`<li>
    <button id="${config.id.tenKToolsButton}"
            class="s-topbar--item s-btn s-btn__muted"
            aria-label="${config.label.tenKToolsLabel}"
            title="${config.label.tenKToolsLabel}"
            role="menuitem"
            aria-controls="${config.id.popover}"
            data-controller="s-popover"
            data-action="s-popover#toggle"
            data-s-popover-placement="bottom-end"
            data-s-popover-toggle-class="is-selected">
        <svg aria-hidden="true" class="svg-icon iconGraph" width="18" height="18" viewBox="0 0 18 18">
            <path d="M3 1h12c1.09 0 2 .91 2 2v12c0 1.09-.91 2-2 2H3c-1.09 0-2-.91-2-2V3c0-1.1.9-2 2-2Zm1 8v5h2V9H4Zm4-5v10h2V4H8Zm4 3v7h2V7h-2Z"></path>
        </svg>
        <div class="v-visible-sr">${config.label.tenKToolsLabel}</div>
    </button>
</li>`);
            const topbarDialogue = $(`<li role="presentation">
    <div class="topbar-dialog" id="${config.id.popover}" role="menu">
        <div class="header fw-wrap">
            <h3 class="flex--item">${config.label.tenKToolsLabel}</h3>
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
        <div class="px0 py4">
            <ul class="s-menu" role="menu">
                <li class="s-menu--title" role="separator">Reports</li>
                <li role="menuitem"><a href="/tools/new-answers-old-questions" class="${config.css.menuLink}">new answers to old questions</a></li>
                <li role="menuitem"><a href="/tools/protected-questions" class="${config.css.menuLink}">protected questions</a></li>
                <li role="menuitem"><a href="/tools/post-feedback" class="${config.css.menuLink}">anonymous and low rep post feedback</a></li>
                <li class="s-menu--title" role="separator">Tags</li>
                <li role="menuitem"><a href="/tags/synonyms" class="${config.css.menuLink}">tag synonyms</a></li>
                <li role="menuitem"><a href="/tags?tab=new" class="${config.css.menuLink}">new tags</a></li>
                <li class="s-menu--title" role="separator">Stats</li>
                <li role="menuitem"><a href="/tools/question-close-stats" class="${config.css.menuLink}">question close stats</a></li>
                <li role="menuitem"><a href="/tools/suggested-edits" class="${config.css.menuLink}">suggested edit stats</a></li>
                <li role="menuitem"><a href="/tools?tab=stats" class="${config.css.menuLink}">stats</a></li>
                <li role="menuitem"><a href="/tools?tab=migrated" class="${config.css.menuLink}">migrated</a></li>
                <li role="menuitem"><a href="/tools?tab=close" class="${config.css.menuLink}">closed</a></li>
                <li role="menuitem"><a href="/tools?tab=delete" class="${config.css.menuLink}">deleted</a></li>
                ${userRep >= repThresholds[config.access.siteAnalytics] ? `<li class="s-menu--title" role="separator">Analytics</li><li role="menuitem"><a href="/site-analytics" class="${config.css.menuLink}">site analytics</a></li>` : ''}
            </ul>
        </div>
    </div>
</li>`);

            const addStyleSheet = () => {
                const style = document.createElement('style');
                style.id = '10k-tools-topbar-styles';
                style.innerHTML = `#${config.id.popover} {
  margin-top: -10px !important;
}

#${config.id.popover}:not(.is-visible) {
  display: none;
}

#${config.id.tenKToolsButton}:focus {
  box-shadow: none;
}`;
                document.head.appendChild(style);
            };

            const addTopbarButton = () => {
                const mountAfter = $('#review-button').closest('li');
                mountAfter.after(topbarButton);
                topbarButton.after(topbarDialogue);
            };

            addStyleSheet();
            addTopbarButton();
        }
    };

    StackExchange.ready(() => {
        void main();
    });
})();