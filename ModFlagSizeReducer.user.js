// ==UserScript==
// @name         ModFlagSizeReducer
// @description  Tries to makes mod flags smaller where possible
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.1
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/ModFlagSizeReducer.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/ModFlagSizeReducer.user.js
//
// @match        *://*stackoverflow.com/questions/*
// @exclude      *://*stackoverflow.com/c/*
// @grant        none
//
// ==/UserScript==
/* globals StackExchange, $ */

(function () {
    'use strict';

    const patterns = [
        // Shorten domain/qa/postid/userid to just /qa/postid
        (s) => s.replace(
            new RegExp(`\\[(.*)\\]\\((${window.location.origin})?\/([qa])\/(\\d+)(?:\/\\d+)?\\)`, 'g'),
            "[$1](/$3/$4)"
        ),
        // Shorten domain/questions/postid/title to just /q/postid
        (s) => s.replace(
            new RegExp(`\\[(.*)\\]\\((${window.location.origin})?\/questions\/(\\d+)\/[^/]+\\)`, 'g'),
            "[$1](/q/$3)"
        ),
        // Shorten domain/questions/questionid/title/answerid#answerid to just /a/answerid
        (s) => s.replace(
            new RegExp(`\\[(.*)\\]\\((${window.location.origin})?\/questions\/\\d+\/[^/]+\/(\\d+)#\\d+\\)`, 'g'),
            "[$1](/a/$3)"
        ),
        // Shorten domain/questions/postid/title#comment[commentid]_[postid] to just /posts/comments/commentid
        (s) => s.replace(
            new RegExp(`\\[(.*)\\]\\((${window.location.origin})?\/questions\/\\d+\/[^/]+\\/\\d+#comment(\\d+)_\\d+\\)`, 'g'),
            "[$1](/posts/comments/$3)"
        ),
        // Shorten domain/posts/comments/commentid to just /posts/comments/commentid
        (s) => s.replace(
            new RegExp(`\\[(.*)\\]\\((${window.location.origin})?(\/posts\/comments\/\\d+)\\)`, 'g'),
            "[$1]($3)"
        )
    ];

    const patternReducer = (text) => {
        for (let reducer of patterns) {
            text = reducer(text);
        }
        return text;
    };

    $('.js-flag-post-link').on('click', () => {
        $(document).on("DOMNodeInserted", (nodeEvent) => {
            if ($(nodeEvent.target).hasClass("popup") && $(nodeEvent.target).attr("id") === "popup-flag-post") {
                const textArea = $('textarea[name="otherText"]');
                const reduceButton = $('<button type="button" class="s-btn">Try Reducing Patterns</button>');
                reduceButton.on('click', () => {
                    const val = textArea.val();
                    textArea.val(patternReducer(val));
                });
                textArea.parent().append(reduceButton);
            }
        });
    });
}());