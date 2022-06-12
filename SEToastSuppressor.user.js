// ==UserScript==
// @name         SE Toast Suppressor
// @description  Suppress just the "You haven&#39;t voted on questions in a while; questions need votes too!" toast
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.4
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/SEToastSuppressor.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/SEToastSuppressor.user.js
//
// @match        *://*.askubuntu.com/questions/*
// @match        *://*.serverfault.com/questions/*
// @match        *://*.stackapps.com/questions/*
// @match        *://*.stackexchange.com/questions/*
// @match        *://*.stackoverflow.com/questions/*
// @match        *://*.superuser.com/questions/*
// @match        *://*.mathoverflow.net/questions/*
//
// @match        *://*.askubuntu.com/review/*
// @match        *://*.serverfault.com/review/*
// @match        *://*.stackapps.com/review/*
// @match        *://*.stackexchange.com/review/*
// @match        *://*.stackoverflow.com/review/*
// @match        *://*.superuser.com/review/*
// @match        *://*.mathoverflow.net/review/*
//
// @grant        none
//
// ==/UserScript==
/* globals StackExchange */

(function () {
    'use strict';

    const messagesToSuppress = new Set([
        'You haven&#39;t voted on questions in a while; questions need votes too!'
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