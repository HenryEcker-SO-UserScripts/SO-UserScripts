// ==UserScript==
// @name         Natty Fetch Helper
// @description  Adds buttons to fetch information from Natty (No more unstoppable Natty link dumps forgetting to specify the number)
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.1.7
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/NattyFetchHelper.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/NattyFetchHelper.user.js
//
// @match        *://chat.stackoverflow.com/rooms/111347/*
//
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        none
//
// ==/UserScript==
/* globals CHAT, $, GM_config */

const getFormDataFromObject = (obj) => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        acc.set(key, value);
        return acc;
    }, new FormData());
};


GM_config.init({
    'id': 'Natty_Fetch_Helper_Config',
    'title': 'Natty Fetch Helper Config',
    'fields': {
        'TYPE_TO_FETCH': {
            'label': 'Type to fetch',
            'type': 'select',
            'options': ['links', 'sentinel'],
            'default': 'links'
        },
        'ROWS_TO_FETCH': {
            'label': 'Number of rows to request per message',
            'type': 'int',
            'min': 1,
            'max': 6,
            'default': 2
        }
    }
});

(function () {
    'use strict';

    const STATIC_CONFIG = {
        'maxRowLengths': {
            'links': 11,
            'sentinel': 8
        },
        'countAlias': ['count', 'amount', 'number']
    };

    Array.prototype.sample = function () {
        return this[Math.floor(Math.random() * this.length)];
    };


    const sendMessagePOST = (messageText) => {
        return fetch(`/chats/${CHAT.CURRENT_ROOM_ID}/messages/new`, {
            method: 'POST',
            body: getFormDataFromObject({
                'text': messageText,
                'fkey': window.fkey().fkey
            })
        });
    };

    const sendMessageOnButtonClick = (messageTextBuilder) => {
        return () => {
            sendMessagePOST(messageTextBuilder()).then(() => {
                // Do Nothing
            }).catch((res) => {
                // Log For Safety
                console.error('Something went wrong!');
                console.error(res);
            });
        };
    };

    const makeButtons = () => {
        const fetchLinksButton = $('<button class="button" style="margin-left: 5px">Fetch Links</button>');
        fetchLinksButton.on('click', sendMessageOnButtonClick(() => {
            const fetchType = GM_config.get('TYPE_TO_FETCH');
            const numberOfPosts = GM_config.get('ROWS_TO_FETCH') * STATIC_CONFIG.maxRowLengths[fetchType];
            return `@Natty fetch ${fetchType} ${numberOfPosts}`;
        }));

        const fetchCountButton = $('<button class="button" style="margin-left: 5px">Fetch Count</button>');
        fetchCountButton.on('click', sendMessageOnButtonClick(() => {
            return `@Natty fetch ${STATIC_CONFIG.countAlias.sample()}`;
        }));

        const settingsButton = $('<button class="button" title="Natty Fetch Helper Settings" style="margin-left: 5px">⚙</button>');
        settingsButton.on('click', () => {
            GM_config.open();
        });

        const cb = $('#chat-buttons');
        cb.append(fetchLinksButton);
        cb.append(fetchCountButton);
        cb.append(settingsButton);
    };
    makeButtons();
})();
