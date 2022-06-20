// ==UserScript==
// @name         SE Toast Suppressor
// @description  Suppress annoying toast messages network-wide
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.6
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/SEToastSuppressor.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/SEToastSuppressor.user.js
//
// @match        *://*.askubuntu.com/*
// @match        *://*.serverfault.com/*
// @match        *://*.stackapps.com/*
// @match        *://*.stackexchange.com/*
// @match        *://*.stackoverflow.com/*
// @match        *://*.superuser.com/*
// @match        *://*.mathoverflow.net/*
//
// @grant        none
//
// ==/UserScript==
/* globals StackExchange */

(function () {
    'use strict';

    const messagesToSuppress = new Set([
        'You haven&#39;t voted on questions in a while; questions need votes too!',
        'Please consider adding a comment if you think this post can be improved.'
    ]);

    StackExchange.ready(() => {
        StackExchange.helpers.showToast = new Proxy(StackExchange.helpers.showToast, {
            apply: (target, thisArg, [message, config]) => {
                if (!messagesToSuppress.has(message)) {
                    target(message, config);
                }
            }
        });
    });
}());
