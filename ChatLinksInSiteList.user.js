// ==UserScript==
// @name         Site List Chat Links
// @description  Adds links to all chat servers in the site list
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.1
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
// @exclude     *://area51*.stackexchange.com/
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
        mountBefore.before(
            // Chat Links
            $(`<div class="modal-content">
    <ul class="my-sites">
        <li>
            <a href="https://chat.stackoverflow.com" class="site-link d-flex gs8 gsx">
                <div class="favicon favicon-stackoverflow site-icon flex--item" title="Stack Overflow Chat"></div>
                <span class="flex--item fl1">Stack Overflow Chat</span>
            </a>
        </li>
        <li>
            <a href="https://chat.stackexchange.com" class="site-link d-flex gs8 gsx">
                <div class="favicon favicon-stackexchange site-icon flex--item" title="Meta Stack Exchange Chat"></div>
                <span class="flex--item fl1">Stack Exchange Chat</span>
            </a>
        </li>
        <li>
            <a href="https://chat.meta.stackexchange.com" class="site-link d-flex gs8 gsx">
                <div class="favicon favicon-stackexchangemeta site-icon flex--item"
                     title="Meta Stack Exchange Chat"></div>
                <span class="flex--item fl1">Meta Stack Exchange Chat</span>
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
