// ==UserScript==
// @name         Fix i.sstatic One Box Links
// @description  Unstrips image final characters in surrounding href
// @homepage     https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.1
// @downloadURL  https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/FixisstaticOneBoxLinks.js
// @updateURL    https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/FixisstaticOneBoxLinks.js
//
// @match     *://chat.stackexchange.com/rooms/*/*
// @match     *://chat.meta.stackexchange.com/rooms/*/*
// @match     *://chat.stackoverflow.com/rooms/*/*
//
// @match     *://chat.stackexchange.com/transcript/*
// @match     *://chat.meta.stackexchange.transcript/rooms/*
// @match     *://chat.stackoverflow.com/transcript/*
//
// ==/UserScript==
/* globals $ */

'use strict';

(function () {
    const fixOneBoxedLinks = () => {
        // Find One Boxed i.sstatic images
        $('.onebox.ob-image img[src^="https://i.sstatic.net"]')
            .each((i, n) => {
                const $img = $(n);
                const $a = $img.closest('a[href^="https://i.sstatic.net"]');
                // If the anchor href doesn't match the image URL fix it
                if ($a.attr('href') !== $img.attr('src')) {
                    $a.attr('href', $img.attr('src'));
                }
            });
    };

    window.addEventListener('load', fixOneBoxedLinks);

    $(document).on('ajaxComplete', (event, {responseJSON}, {url}) => {
        if (/\/chats\/\d+\/events/g.exec(url) || url.startsWith('/transcript')) {
            fixOneBoxedLinks();
        }
    });
})();
