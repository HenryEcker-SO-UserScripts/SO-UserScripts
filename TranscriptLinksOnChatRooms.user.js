// ==UserScript==
// @name         Transcript Links On Chat Rooms
// @description  Adds a link directly to the chat transcript on each Chat Room element
// @homepage     https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.2.4
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

    const transcriptLinkClass = 'js-tlocr-transcript-link';

    const $createBaseTranscriptLink = (roomId) => {
        return $(`<a href="/transcript/${roomId}" class="${transcriptLinkClass}">transcript</a>`);
    };

    const hasTranscriptLink = ($e) => {
        return $e.find(`.${transcriptLinkClass}`).length !== 0;
    };

    const addTranscriptLinksToMiniRooms = () => {
        $('.roomcard').each((i, n) => {
            const $e = $(n);

            if (hasTranscriptLink($e)) {
                return;
            }

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
        addTranscriptLinksToMiniRooms();
    };

    $(document).on('ajaxComplete', (_0, _1, {url}) => {
        // Rebuild on room refresh
        if (url.startsWith('/users')) {
            addTranscriptLinks();
        }
    });

    addTranscriptLinks();
})();