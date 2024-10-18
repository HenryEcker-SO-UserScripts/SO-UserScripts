// ==UserScript==
// @name         Transcript Links On Chat Rooms
// @description  Adds a link directly to the chat transcript on each Chat Room element
// @homepage     https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.1.0
// @downloadURL  https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/TranscriptLinksOnChatRooms.user.js
// @updateURL    https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/TranscriptLinksOnChatRooms.user.js
//
// @match        *://chat.stackoverflow.com/
// @match        *://chat.stackoverflow.com/?*
// @match        *://chat.stackoverflow.com/rooms
// @match        *://chat.stackoverflow.com/rooms?*
// @match        *://chat.stackoverflow.com/users/*
//
// @match        *://chat.stackexchange.com/
// @match        *://chat.stackexchange.com/?*
// @match        *://chat.stackexchange.com/rooms
// @match        *://chat.stackexchange.com/rooms?*
// @match        *://chat.stackexchange.com/users/*
//
// @match        *://chat.meta.stackexchange.com/
// @match        *://chat.meta.stackexchange.com/?*
// @match        *://chat.meta.stackexchange.com/rooms
// @match        *://chat.meta.stackexchange.com/rooms?*
// @match        *://chat.meta.stackexchange.com/users/*
//
// ==/UserScript==
/* globals $ */

(function () {
    'use strict';


    const $createBaseTranscriptLink = (roomId) => {
        return $(`<a href="/transcript/${roomId}">transcript</a>`);
    };

    const addTranscriptLinksToRooms = () => {
        $('.room-info-link').each((i, n) => {
            const $e = $(n);

            // Place corresponding transcript link at the end of each room-info-link container
            const roomId = $e.parent('div').attr('id').split('-')[1];

            // Build Transcript Object
            $createBaseTranscriptLink(roomId)
                .css({'margin-left': '7px'})
                .appendTo($e);

            // Reduce left offset to accommodate transcript label
            $e.css({'left': '70px', 'width': 'unset'});
        });
    };


    const addTranscriptLinksToMiniRooms = () => {
        $('.room-mini-header').each((i, n) => {
            const $e = $(n);
            // Get Room id from room name link
            const roomId = Number(/^\/rooms\/(\d+)/.exec($e.find('.room-name a').attr('href'))[1]);
            $e.append(
                $createBaseTranscriptLink(roomId)
                    .css({'display': 'block', 'margin-top': '7px'})
            );
        });
    };

    const addTranscriptLinks = () => {
        addTranscriptLinksToRooms();
        addTranscriptLinksToMiniRooms();
    };

    $(document).on('ajaxComplete', (_0, _1, {url}) => {
        // Rebuild on room refresh
        if (url.startsWith('/rooms')) {
            addTranscriptLinks();
        } else if (url.startsWith('/users')) {
            addTranscriptLinks();
        }
    });

    addTranscriptLinks();
})();