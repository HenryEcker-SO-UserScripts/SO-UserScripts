// ==UserScript==
// @name         SE Toast/FancyOverlay Suppressor
// @description  Suppress annoying toast/overlay messages network-wide
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.8
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
// @run-at       document-start
//
// @grant        none
//
// ==/UserScript==
/* globals StackExchange */

(function () {
    'use strict';

    const toastMessagesToSuppress = new Set([
        'You haven&#39;t voted on questions in a while; questions need votes too!',
        'Please consider adding a comment if you think this post can be improved.'
    ]);

    const fancyOverlayMessagesToSuppress = new Set([
        'Welcome back! If you found this question useful,\u003cbr/\u003edon\u0027t forget to vote both the question and the answers up.'
    ]);

    const addProxies = () => {
        StackExchange.helpers.showToast = new Proxy(StackExchange.helpers.showToast, {
            apply: (target, thisArg, [message, config]) => {
                if (!toastMessagesToSuppress.has(message)) {
                    target(message, config);
                }
            }
        });

        StackExchange.helpers.showFancyOverlay = new Proxy(StackExchange.helpers.showFancyOverlay, {
            apply: (target, thisArg, [config]) => {
                if (!fancyOverlayMessagesToSuppress.has(config.message)) {
                    target(config);
                }
            }
        });
    };

    if (window.StackExchange === undefined || Object.keys(window.StackExchange).length === 0) {
        Object.defineProperty(window, 'StackExchange', {
            configurable: true,
            internalSE: undefined,
            get () {
                return this.internalSE;
            },
            set (newStackExchange) {
                if (Object.keys(newStackExchange).length !== 0) {
                    delete window.StackExchange;
                    window.StackExchange = newStackExchange;
                    addProxies();
                } else {
                    this.internalSE = newStackExchange;
                }
            }
        });
    } else {
        addProxies();
    }
}());