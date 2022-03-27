// ==UserScript==
// @name         Natty Fetch Helper
// @description  Adds buttons to fetch information from Natty (No more unstoppable Natty link dumps forgetting to specify the number)
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.1.0
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/NattyFetchHelper.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/NattyFetchHelper.user.js
//
// @include      /^https?://chat.stackoverflow.com/rooms/111347/.*/
// @run-at       document-end
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant        GM_getValue
// @grant        GM_setValue
//
// ==/UserScript==
/* globals CHAT, $, GM_config */


GM_config.init({
    'id': 'Natty_Fetch_Helper_Config',
    'title': 'Natty Fetch Helper Config',
    'fields': {
        'ROWS_TO_FETCH': {
            'label': 'Number of rows to request per message',
            'type': 'int',
            default: 2
        },
    }
});

(function () {
    'use strict';

    const STATIC_CONFIG = {
        'linksMaxRowLength': 11,
        'countAlias': ['count', 'amount', 'number']
    };

    Array.prototype.sample = function () {
        return this[Math.floor(Math.random() * this.length)];
    }


    const sendMessagePOST = (messageText) => {
        const parameters = new FormData();
        parameters.append('text', messageText);
        parameters.append('fkey', window.fkey().fkey);
        return fetch(`/chats/${CHAT.CURRENT_ROOM_ID}/messages/new`, {
            method: 'POST',
            body: parameters
        });
    };

    const sendMessageOnButtonClick = (messageText) => (ev) => {
        sendMessagePOST(messageText).then((res) => {
            // console.log(res);
            // Do Nothing
        }).catch((res) => {
            // Log For Safety
            console.log('Something went wrong!');
            console.log(res);
        });
    };

    const makeButtons = () => {
        const fetchLinksButton = $('<button class="button" style="margin-left: 5px">Fetch Links</button>');
        fetchLinksButton.on('click', sendMessageOnButtonClick(`@Natty fetch links ${GM_config.get('ROWS_TO_FETCH') * STATIC_CONFIG.linksMaxRowLength}`));

        const fetchCountButton = $('<button class="button" style="margin-left: 5px">Fetch Count</button>');
        fetchCountButton.on('click', sendMessageOnButtonClick(`@Natty fetch ${STATIC_CONFIG.countAlias.sample()}`));

        const settingsButton = $('<button class="button" title="Natty Fetch Helper Settings" style="margin-left: 5px">⚙</button>');
        settingsButton.on('click', () => GM_config.open());

        const cb = $('#chat-buttons');
        cb.append(fetchLinksButton);
        cb.append(fetchCountButton);
        cb.append(settingsButton);
    };
    makeButtons();
})();
