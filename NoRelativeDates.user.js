// ==UserScript==
// @name         SE No Relative Dates
// @description  Always display full UTC time
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.1
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/NoRelativeDates.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/NoRelativeDates.user.js
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
/* globals $, StackExchange */

(function () {
    const formatter = new Intl.DateTimeFormat('default', {
        timeZone: 'UTC',
        hour12: false,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    StackExchange.ready(() => {
        $('.post-signature').each((i, e) => {
            $(e).css('width', '205px'); // Make big enough to handle full date
        });
        $('.relativetime').each((i, e) => {
            $(e).text(formatter.format(new Date($(e).attr('title'))));
        });
    });
}());