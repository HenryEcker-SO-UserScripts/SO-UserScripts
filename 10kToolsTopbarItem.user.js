// ==UserScript==
// @name         Adds a 10k Tools
// @description  Adds a Button to the topbar which gives a direct list to all 10k tool pages
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.2
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/10kToolsTopbarItem.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/10kToolsTopbarItem.user.js
//
// @match        *://*.stackoverflow.com/*
//
// @grant        none
//
// ==/UserScript==
/* globals $, StackExchange */

(function () {
    'use strict';

    StackExchange.ready(() => {
        const userRep = StackExchange.options.user.rep;
        if (userRep > 10e3) {


            const popoverId = 'tools-popover';

            const rowClasses = '-item lh-xxl';

            const topbarButton = $(`<li>
    <button id="10k-tools-button"
            class="s-topbar--item s-btn"
            aria-label="10k Tools"
            title="10k Tools"
            role="menuitem"
            aria-controls="${popoverId}"
            data-controller="s-popover"
            data-action="s-popover#toggle"
            data-s-popover-placement="bottom-end"
            data-s-popover-toggle-class="is-selected">
        <svg aria-hidden="true" class="svg-icon iconGraph" width="18" height="18" viewBox="0 0 18 18">
            <path d="M3 1h12c1.09 0 2 .91 2 2v12c0 1.09-.91 2-2 2H3c-1.09 0-2-.91-2-2V3c0-1.1.9-2 2-2Zm1 8v5h2V9H4Zm4-5v10h2V4H8Zm4 3v7h2V7h-2Z"></path>
        </svg>
        <div class="v-visible-sr">10k Tools</div>
    </button>
</li>`);
            const topbarDialogue = $(`<li role="presentation">
    <div class="topbar-dialog" id="${popoverId}" role="menu">
        <div class="header fw-wrap">
            <h3 class="flex--item">10k Tools</h3>
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

        <div class="modal-content">
            <ul>
                <li class="${rowClasses}"><a href="/tools?tab=stats"><span class="-title">Stats</span></a></li>
                <li class="${rowClasses}"><a href="/tools?tab=migrated"><span class="-title">Migrated</span></a></li>
                <li class="${rowClasses}"><a href="/tools?tab=close"><span class="-title">Closed</span></a></li>
                <li class="${rowClasses}"><a href="/tools?tab=delete"><span class="-title">Deleted</span></a></li>
                <li class="${rowClasses}"><a href="/tools/new-answers-old-questions"><span class="-title">New answers to old questions</span></a></li>
                <li class="${rowClasses}"><a href="/tools/suggested-edits"><span class="-title">Suggested edit stats</span></a></li>
                <li class="${rowClasses}"><a href="/tools/post-feedback"><span class="-title">Anonymous and low rep post feedback</span></a></li>
                ${userRep >= 25e3 ? `<li class="${rowClasses}"><a href="/site-analytics"><span class="-title">Site analytics</span></a></li>` : ''}
                <li class="${rowClasses}"><a href="/tools/question-close-stats"><span class="-title">Question close stats</span></a></li>
                <li class="${rowClasses}"><a href="/tools/protected-questions"><span class="-title">Protected questions</span></a></li>
            </ul>
        </div>
    </div>
</li>`);

            const addStyleSheet = () => {
                const style = document.createElement('style');
                style.id = '10k-tools-topbar-styles';
                style.type = 'text/css';
                style.innerHTML = `#${popoverId}:not(.is-visible){display:none;}#${popoverId}{margin-top: -10px !important;}`;
                document.head.appendChild(style);
            };

            const addTopButton = () => {
                const mountAfter = $('#review-button').closest('li');
                console.log(mountAfter);
                mountAfter.after(topbarButton);
                topbarButton.after(topbarDialogue);
            };

            addStyleSheet();
            addTopButton();
        }
    });
})();