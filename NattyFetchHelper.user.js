// ==UserScript==
// @name         Natty Fetch Helper
// @description  Adds buttons to fetch information from Natty (No more unstoppable Natty link dumps forgetting to specify the number)
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.2.1
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/NattyFetchHelper.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/NattyFetchHelper.user.js
//
// @match        *://chat.stackoverflow.com/rooms/111347/*
//
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant        GM_getValue
// @grant        GM_setValue
//
// ==/UserScript==
/* globals CHAT $, GM_config */

(function () {
    'use strict';

    if (typeof unsafeWindow !== 'undefined' && window !== unsafeWindow) {
        window.fkey = unsafeWindow.fkey;
    }

    const STATIC_CONFIG = {
        'maxRowLengths': {
            'links': 11,
            'nondeleted': 11,
            'sentinel': 8
        },
        'countAlias': ['count', 'amount', 'number']
    };

    function getFormDataFromObject(obj) {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            acc.set(key, value);
            return acc;
        }, new FormData());
    }


    function sendMessagePOST(messageText) {
        return fetch(`/chats/${CHAT.CURRENT_ROOM_ID}/messages/new`, {
            method: 'POST',
            body: getFormDataFromObject({
                'text': messageText,
                'fkey': window.fkey().fkey
            })
        });
    }

    function sendMessageOnButtonClick(messageTextBuilder) {
        return () => {
            sendMessagePOST(messageTextBuilder()).then(() => {
                // Do Nothing
            }).catch((res) => {
                // Log For Safety
                console.error('Something went wrong!');
                console.error(res);
            });
        };
    }

    function getFetchButtonText() {
        const fetchType = GM_config.get('TYPE_TO_FETCH');
        return `Fetch ${fetchType.charAt(0).toUpperCase()}${fetchType.slice(1)}`;
    }


    function sampleArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }


    async function main() {
        // Don't progress until init completes (init event triggers resolve)
        await new Promise((resolve) => {
            const options = [...Object.keys(STATIC_CONFIG.maxRowLengths)];
            GM_config.init({
                'id': 'Natty_Fetch_Helper_Config',
                'title': 'Natty Fetch Helper Config',
                'fields': {
                    'TYPE_TO_FETCH': {
                        'label': 'Type to fetch',
                        'type': 'select',
                        'options': options,
                        'default': options[0]
                    },
                    'ROWS_TO_FETCH': {
                        'label': 'Number of rows to request per message',
                        'type': 'int',
                        'min': 1,
                        'max': 10,
                        'default': 2
                    }
                },
                'events': {
                    'init': resolve,
                    'save': () => {
                        fetchButton.text(getFetchButtonText());
                    }
                }
            });
        });

        const fetchButton = $(`<button class="button" style="margin-left: 5px">${getFetchButtonText()}</button>`);
        fetchButton.on('click', sendMessageOnButtonClick(() => {
            const fetchType = GM_config.get('TYPE_TO_FETCH');
            const numberOfPosts = GM_config.get('ROWS_TO_FETCH') * STATIC_CONFIG.maxRowLengths[fetchType];
            return `@Natty fetch ${fetchType} ${numberOfPosts}`;
        }));

        const fetchCountButton = $('<button class="button" style="margin-left: 5px">Fetch Count</button>');
        fetchCountButton.on('click', sendMessageOnButtonClick(() => {
            return `@Natty fetch ${sampleArray(STATIC_CONFIG.countAlias)}`;
        }));

        const settingsButton = $('<button class="button" title="Natty Fetch Helper Settings" style="margin-left: 5px">⚙</button>');
        settingsButton.on('click', () => {
            GM_config.open();
        });

        const cb = $('#chat-buttons');
        cb.append(fetchButton);
        cb.append(fetchCountButton);
        cb.append(settingsButton);
    }

    void main();
})();