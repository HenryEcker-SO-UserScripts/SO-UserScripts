// ==UserScript==
// @name         Transcript Links On Chat Rooms
// @description  Adds a link directly to the chat transcript on each Chat Room element
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.1
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/TranscriptLinksOnChatRooms.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/TranscriptLinksOnChatRooms.user.js
//
// @include      /^https?:\/\/chat\.(meta\.)?stack(overflow|exchange)\.com(\/|\/\?.+)$/
//
// ==/UserScript==
/* globals $ */

(function () {
    'use strict';

    const buildTranscriptLinks = () => {
        $('.room-info-link').each((i, n) => {
            const e = $(n);
            // Place corresponding transcript link after each info link
            e.find('a').after(
                $(`<a href="/transcript/${
                    // Find Room Id from div
                    e.parent('div').attr('id').split('-')[1]
                }" style="margin-left: 7px;">transcript</a>`)
            );
            // Reduce left offset to accommodate transcript label
            e.css('left', '70px');
        });
    };

    $(document).on('ajaxComplete', (_0, _1, {url}) => {
        // Rebuild on room refresh
        if (url.startsWith('/rooms')) {
            buildTranscriptLinks();
        }
    });

    buildTranscriptLinks();
})();