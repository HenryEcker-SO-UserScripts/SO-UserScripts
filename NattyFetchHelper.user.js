// ==UserScript==
// @name         Natty Fetch Helper
// @description  Adds buttons to fetch information from Natty (No more unstoppable Natty link dumps forgetting to specify the number)
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.0.8
//
// @include /^https?://chat.stackoverflow.com/rooms/111347/.*/
// @run-at  document-end
// @grant none
//
// ==/UserScript==
/* globals CHAT, $ */

'use strict';

(() => {

    const config = {
        'linksMaxRowLength': 11,
        'rowsToFetch': 4,
        'countAlias': ['count', 'amount', 'number']
    };

    Array.prototype.sample = function(){
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
        fetchLinksButton.click(sendMessageOnButtonClick(`@Natty fetch links ${config.rowsToFetch * config.linksMaxRowLength}`));

        const fetchCountButton = $('<button class="button" style="margin-left: 5px">Fetch Count</button>');
        fetchCountButton.click(sendMessageOnButtonClick(`@Natty fetch ${config.countAlias.sample()}`));

        const cb = $('#chat-buttons');
        cb.append(fetchLinksButton);
        cb.append(fetchCountButton);
    };
    makeButtons();
})();
