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

    const baseShortQAPattern = new RegExp(`(${window.location.origin})?\/([qa])\\/(\\d+)(?:\\/\\d+)?`, 'g');

    const shortQAPattern = new RegExp(`\\[(.*)\\]\\(${baseShortQAPattern.source}\\)`, 'g');
    const fullQPattern = new RegExp(`\\[(.*)\\]\\((${window.location.origin})?\/questions\/(\\d+)\/[^/]+\\)`, 'g');
    const fullAPattern = new RegExp(`\\[(.*)\\]\\((${window.location.origin})?\/questions\/\\d+\/[^/]+\/(\\d+)#\\d+\\)`, 'g');
    const fullCommentPattern = new RegExp(`\\[(.*)\\]\\((${window.location.origin})?\/questions\/\\d+\/[^/]+\\/\\d+#comment(\\d+)_\\d+\\)`, 'g');
    const shortCommentPattern = new RegExp(`\\[(.*)\\]\\((${window.location.origin})?(\/posts\/comments\/\\d+)\\)`, 'g');
    const commaSeparatedPostsPattern = new RegExp(`(${baseShortQAPattern.source}(,\\s*|$))+`, 'g');
    const reducers = [
        // Shorten domain/qa/postid/userid to just /qa/postid
        (s) => s.replace(
            shortQAPattern,
            "[$1](/$3/$4)"
        ),
        // Bulk Enumerate and reduce domain?/qa/post1id/userid?,domain?/qa/post2id/userid? to [1](/qa/post1id), [2](/qa/post2id),...
        (s) => s.replace(commaSeparatedPostsPattern, (substring) => {
            return substring.match(baseShortQAPattern).map((match, idx) => {
                return match.replace(baseShortQAPattern, `[${idx + 1}](/$2/$3)`)
            }).join(',')
        }),
        // Shorten domain/questions/postid/title to just /q/postid
        (s) => s.replace(
            fullQPattern,
            "[$1](/q/$3)"
        ),
        // Shorten domain/questions/questionid/title/answerid#answerid to just /a/answerid
        (s) => s.replace(
            fullAPattern,
            "[$1](/a/$3)"
        ),
        // Shorten domain/questions/postid/title#comment[commentid]_[postid] to just /posts/comments/commentid
        (s) => s.replace(
            fullCommentPattern,
            "[$1](/posts/comments/$3)"
        ),
        // Shorten domain/posts/comments/commentid to just /posts/comments/commentid
        (s) => s.replace(
            shortCommentPattern,
            "[$1]($3)"
        )
    ];

    const patternReducer = (text) => {
        for (let reducer of reducers) {
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