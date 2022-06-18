// ==UserScript==
// @name         Bad Review Reporter
// @description  Adds a quick UI to any completed review to report to Bad Stack Overflow Reviews (https://chat.stackoverflow.com/rooms/208985)
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.1
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/BadReviewReporter.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/BadReviewReporter.user.js
//
// @match        *://*.askubuntu.com/review/*
// @match        *://*.serverfault.com/review/*
// @match        *://*.stackapps.com/review/*
// @match        *://*.stackexchange.com/review/*
// @match        *://*.stackoverflow.com/review/*
// @match        *://*.superuser.com/review/*
// @match        *://*.mathoverflow.net/review/*
//
// @exclude      /^https?:\/\/.*((askubuntu|serverfault|stackapps|stackexchange|stackoverflow|superuser)\.com|mathoverflow\.net)\/review\/.*\/(stats|history)/
//
// @grant        none
//
// ==/UserScript==
/* globals $, StackExchange */

(function () {

    'use strict';

    const reviewOptions = {
        'close': ['Leave open', 'Close', 'Edit'],
        'reopen': ['Leave closed', 'Edit and reopen', 'Reopen'],
        'low-quality-posts': ['Looks OK', 'Edit', 'Delete'],
        'suggested-edits': ['Approve', 'Reject'],
        'first-answers': ['Looks OK', 'Edit', 'Share feedback', 'Other action'],
        'first-questions': ['Looks OK', 'Edit', 'Share feedback', 'Other action'],
        'late-answers': ['Looks OK', 'Edit', 'Delete', 'Other action'],
        'triage': ['Looks OK', 'Needs community edit', 'Flag', 'Needs author edit']
    };

    StackExchange.ready(() => {
        $(document).on('ajaxComplete', (event, {responseJSON}, {url}) => {
            if (url.startsWith('/review/next-task/') &&
                responseJSON?.instructions !== undefined &&
                (responseJSON?.isAudit !== undefined && responseJSON.isAudit === false)
            ) {
                // Convert instruction banner into JQuery Element
                const component = $(responseJSON.instructions.replace(/[\r\n]/g, ''));
                //
                // Find bold elements (These are the review actions taken)
                const actual = Array.from(
                    component.find('ul.mt8.list-reset b')
                        .map((i, e) => {
                            return e.innerText;
                        })
                ).reduce((acc, text) => {
                    if (Object.hasOwn(acc, text)) {
                        acc[text] += 1;
                    } else {
                        acc[text] = 1;
                    }
                    return acc;
                }, {});

                // TODO Add UI To select and provide a reason
                const expected = 'tbd';

                // TODO suggested-edits for wiki should include field to link to source of copied content

                // TODO Replace with message to chatroom
                console.log(`Expected: ${expected}\nActual: ${Object.entries(actual).map(([text, count]) => {
                        return `${count} ${text}`;
                    }).join(', ')}\nLink: ${window.location.href}`
                );
            }
        });
    });
})();