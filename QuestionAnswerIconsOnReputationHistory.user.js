// ==UserScript==
// @name         Reputation History Question and Answer Icons
// @description  Adds question and answer icons next to reputation history events to clarify the type of post
// @homepage     https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.3
// @downloadURL  https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/QuestionAnswerIconsOnReputationHistory.user.js
// @updateURL    https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/QuestionAnswerIconsOnReputationHistory.user.js
//
// @match        *://*.askubuntu.com/users/*/*?tab=reputation*
// @match        *://*.serverfault.com/users/*/*?tab=reputation*
// @match        *://*.stackapps.com/users/*/*?tab=reputation*
// @match        *://*.stackexchange.com/users/*/*?tab=reputation*
// @match        *://*.stackoverflow.com/users/*/*?tab=reputation*
// @match        *://*.superuser.com/users/*/*?tab=reputation*
// @match        *://*.mathoverflow.net/users/*/*?tab=reputation*
//
// @grant        none
//
// ==/UserScript==
/* globals StackExchange, $ */


(function () {
    'use strict';

    const config = {
        questionLinkSelector: 'a.question-hyperlink',
        answerLinkSelector: 'a.answer-hyperlink',
        postExpandableBodySelector: '.js-post-expandable-body',
        jsLoadedClass: 'js-loaded',
        expandableButtonClass: 'js-post-expandable-control',
        hasIconClass: 'qai-has-icon',
        iconColour: 'fc-green-500',
        questionIcon: '<svg aria-hidden="true" class="svg-icon iconQuestion fc-green-500 mx4" width="18" height="18" viewBox="0 0 18 18"><path d="m4 15-3 3V4c0-1.1.9-2 2-2h12c1.09 0 2 .91 2 2v9c0 1.09-.91 2-2 2H4Zm7.75-3.97c.72-.83.98-1.86.98-2.94 0-1.65-.7-3.22-2.3-3.83a4.41 4.41 0 0 0-3.02 0 3.8 3.8 0 0 0-2.32 3.83c0 1.29.35 2.29 1.03 3a3.8 3.8 0 0 0 2.85 1.07c.62 0 1.2-.11 1.71-.34.65.44 1 .68 1.06.7.23.13.46.23.7.3l.59-1.13a5.2 5.2 0 0 1-1.28-.66Zm-1.27-.9a5.4 5.4 0 0 0-1.5-.8l-.45.9c.33.12.66.29.98.5-.2.07-.42.11-.65.11-.61 0-1.12-.23-1.52-.68-.86-1-.86-3.12 0-4.11.8-.9 2.35-.9 3.15 0 .9 1.01.86 3.03-.01 4.08Z"></path></svg>',
        answerIcon: '<svg aria-hidden="true" class="svg-icon iconAnswer fc-green-500 mx4" width="18" height="18" viewBox="0 0 18 18"><path d="M14 15H3c-1.09 0-2-.91-2-2V4c0-1.1.9-2 2-2h12c1.09 0 2 .91 2 2v14l-3-3Zm-1.02-3L9.82 4H8.14l-3.06 8h1.68l.65-1.79h3.15l.69 1.79h1.73Zm-2.93-3.12H7.9l1.06-2.92 1.09 2.92Z"></path></svg>'
    };

    const main = () => {
        $(`${config.questionLinkSelector}:not(.${config.hasIconClass})`)
            .addClass(config.hasIconClass)
            .before($(config.questionIcon));


        $(`${config.answerLinkSelector}:not(.${config.hasIconClass})`)
            .addClass(config.hasIconClass)
            .before($(config.answerIcon));
    };

    StackExchange.ready(() => {
        // Run Function
        main();

        // Restore icons on tab (Post/Time/Graph) navigation (Currently done with ajax request)
        $(document).on('ajaxComplete', (_0, _1, {url}) => {
            if (url.match(/users\/tab\/\d+\?tab=reputation/gi)) {
                main();
            }
        });

        // Watch for data-load expandable to add js-loaded class to element (done on load completion)
        // Can't use ajaxComplete because this data is loaded using fetch
        $(document).on('s-expandable-control:show', (ev) => {
            // Check Target Makes sense
            if ($(ev.target).hasClass(config.expandableButtonClass)) {
                const newElementContainer = $(`#${ev.target.getAttribute('aria-controls')} ${config.postExpandableBodySelector}:not(.${config.jsLoadedClass})`);
                // Only create observer if content is not already loaded
                if (newElementContainer.length === 1) {
                    new MutationObserver((mutations, observer) => {
                        for (const mutation of mutations) {
                            if (mutation.attributeName === 'class'
                                && $(mutation.target).hasClass(config.jsLoadedClass)) {
                                main();
                                // We don't care anymore stop listening
                                observer.disconnect();
                                return;
                            }
                        }
                    }).observe(newElementContainer[0], {attributes: true});
                }
            }
        });
    });
}());