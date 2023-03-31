// ==UserScript==
// @name         Site List Chat Links
// @description  Adds links to all chat servers in the site list
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.4
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/ChatLinksInSiteList.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/ChatLinksInSiteList.user.js
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
// @exclude     *://area51*.stackexchange.com/*
// @exclude     *://api.stackexchange.com/*
// @exclude     *://data.stackexchange.com/*
//
// ==/UserScript==
/* globals $, StackExchange */

'use strict';

(function () {

    const addChatLinks = () => {
        const mountBefore = $('#your-communities-header');
        mountBefore.before(
            // Header
            $(`<div class="header fw-wrap">
    <h3 class="flex--item">
        chat servers
    </h3>
</div>`)
        );
        const linkClasses = 'site-link d-flex ai-center g12';
        mountBefore.before(
            // Chat Links
            $(`<div class="modal-content">
    <ul class="my-sites p6 d-flex fd-row ai-center jc-space-around">
        <li class="bbw0">
            <a href="https://chat.stackoverflow.com/?tab=favorite" class="${linkClasses}" title="Meta Stack Exchange Chat">
                <div class="favicon favicon-stackoverflow site-icon flex--item"></div>
                <span class="flex--item fl1">Chat.SO</span>
            </a>
        </li>
        <li class="bbw0">
            <a href="https://chat.stackexchange.com/?tab=favorite" class="${linkClasses}" title="Meta Stack Exchange Chat">
                <div class="favicon favicon-stackexchange site-icon flex--item"></div>
                <span class="flex--item fl1">Chat.SE</span>
            </a>
        </li>
        <li class="bbw0">
            <a href="https://chat.meta.stackexchange.com/?tab=favorite" class="${linkClasses}" title="Meta Stack Exchange Chat">
                <div class="favicon favicon-stackexchangemeta site-icon flex--item"></div>
                <span class="flex--item fl1">Chat.MSE</span>
            </a>
        </li>
    </ul>
</div>`)
        );
    };

    StackExchange.ready(() => {
        $(document).on('ajaxComplete', (_0, _1, {url}) => {
            // Rebuild on first open of site switcher
            if (url.startsWith('/topbar/site-switcher/site-list')) {
                addChatLinks();
            }
        });
    });
})();
