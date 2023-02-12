// ==UserScript==
// @name         Transcript Links On Chat Rooms
// @description  Adds a link directly to the chat transcript on each Chat Room element
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.5
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/TranscriptLinksOnChatRooms.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/TranscriptLinksOnChatRooms.user.js
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

    const buildTranscriptLinks = () => {
        $('.room-info-link').each((i, n) => {
            const e = $(n);
            // Place corresponding transcript link at the end of each room-info-link container
            $(`<a href="/transcript/${
                // Find Room Id from div
                e.parent('div').attr('id').split('-')[1]
            }" style="margin-left: 7px;">transcript</a>`).appendTo(e);
            // Reduce left offset to accommodate transcript label
            e.css({'left': '70px', 'width': 'unset'});
        });
    };

    $(document).on('ajaxComplete', (_0, _1, {url}) => {
        // Rebuild on room refresh
        if (url.startsWith('/rooms')) {
            buildTranscriptLinks();
        } else if (url.startsWith('/users')) {
            buildTranscriptLinks();
        }
    });

    buildTranscriptLinks();
})();