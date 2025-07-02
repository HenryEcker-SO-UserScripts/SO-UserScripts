// ==UserScript==
// @name         Disable Inbox In Chat
// @description  Chat inbox clears all notifications for reasons^TM so don't let it open
// @homepage     https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.1
// @downloadURL  https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/DisableInboxInChat.user.js
// @updateURL    https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/DisableInboxInChat.user.js
//
// @match        *://chat.stackoverflow.com/*
//
// @match        *://chat.stackexchange.com/*
//
// @match        *://chat.meta.stackexchange.com/*
//
// ==/UserScript==
/* globals $ */

(function () {
    'use strict';

    const $inboxBtn = $('.js-inbox-button');
    $inboxBtn.off('click');
    $inboxBtn.attr('href', 'https://stackexchange.com/users/current?tab=inbox');
}());