// ==UserScript==
// @name         Transcript Links On Chat Rooms
// @description  Adds a link directly to the chat transcript on each Chat Room element
// @homepage     https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.2.2
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
        $('.js-room-card').each((i, n) => {
            const $e = $(n);

            // Get room ID from room card
            const roomId = $e.data('room-id');

            // Find existing link
            const $moreInfoLinkContainer = $e.find('.js-room-card-more-info').parent();

            // Build Transcript Link and place after existing room link
            $createBaseTranscriptLink(roomId)
                .addClass('fc-blue-400 tt-capitalize')
                .wrap('<div class="flex--item"></div>')
                .parent()
                .insertAfter($moreInfoLinkContainer);
        });
    };


    const addTranscriptLinksToMiniRooms = () => {
        $('.roomcard').each((i, n) => {
            const $e = $(n);
            // Get Room id from room card id
            const roomId = Number($e.attr('id').split('-')[1]);
            // Find existing link container
            const $linkContainer = $e.find('.room-info-link');
            // Modify to support holding two links
            $linkContainer
                .addClass('d-flex g8 w100 jc-center ps-absolute b0')
                .css({fontSize: '0.75rem'})
                .removeClass('room-info-link');
            // Add link to container
            $linkContainer.append(
                $createBaseTranscriptLink(roomId)
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