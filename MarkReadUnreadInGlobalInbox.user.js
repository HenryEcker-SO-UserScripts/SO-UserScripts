// ==UserScript==
// @name         Add Read/Unread Buttons to Full Inbox
// @description  Messages can only be marked read or unread from the site inbox, but since there's a limit on the amount of messages in the site inbox, it is becomes impossible to mark certain messages unread.
// @homepage     https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.2
// @downloadURL  https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/MarkReadUnreadInGlobalInbox.user.js
// @updateURL    https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/MarkReadUnreadInGlobalInbox.user.js
//
// @match        *://stackexchange.com/users/*/*?tab=inbox*
//
// @grant        none
//
// ==/UserScript==
/* globals  $, settings */

(function () {

    const messageUnreadRowStyles = 'unread-item';

    const updateInboxCount = (newCount) => {
        $('.js-inbox-button').find('.js-unread-count').prop('textContent', newCount);
    };

    const markMessageUnread = (inboxId) => {
        const fd = new FormData();
        fd.set('inboxId', inboxId);
        fd.set('fkey', settings.fkey);
        return fetch('/topbar/mark-inbox-as-unread', {method: 'POST', body: fd})
            .then((res) => {
                return res.json();
            })
            .then((resData) => {
                updateInboxCount(resData.unreadMessagesCount);
            });
    };

    const markMessageRead = (inboxId) => {
        const fd = new FormData();
        fd.set('inboxId', inboxId);
        fd.set('source', '2');
        fd.set('fkey', settings.fkey);
        return fetch('/topbar/mark-inbox-as-read', {method: 'POST', body: fd})
            .then((res) => {
                return res.json();
            })
            .then((resData) => {
                updateInboxCount(resData.unreadMessagesCount);
            });

    };

    const getInboxRows = () => {
        return $('.inbox-table tr');
    };

    const isUnreadRow = (row) => {
        return row.hasClass(messageUnreadRowStyles);
    };

    const buildMarkReadButton = (e) => {
        const markReadButton = $('<button style="width:max-content">Mark Read</button>');
        markReadButton.on('click', (ev) => {
            ev.preventDefault();
            void markMessageRead(e.attr('id'));
            e.removeClass(messageUnreadRowStyles);
            markReadButton.replaceWith(buildMarkUnreadButton(e)); // Swap with other button type
        });
        return markReadButton;
    };

    const buildMarkUnreadButton = (e) => {
        const markUnreadButton = $('<button style="width:max-content">Mark Unread</button>');
        markUnreadButton.on('click', (ev) => {
            ev.preventDefault();
            void markMessageUnread(e.attr('id'));
            e.addClass(messageUnreadRowStyles);
            markUnreadButton.replaceWith(buildMarkReadButton(e)); // Swap with other button type
        });
        return markUnreadButton;
    };


    const addButtons = () => {
        getInboxRows().each((i, n) => {
            const e = $(n);
            const td = $('<td style="width:min-content"></td>');
            if (isUnreadRow(e)) {
                td.append(buildMarkReadButton(e));
            } else {
                td.append(buildMarkUnreadButton(e));
            }
            e.append(td);
        });
    };

    addButtons();
    // Listen for page changes
    $(document).on('ajaxComplete', (_0, _1, {url, type}) => {
        if (type.toLowerCase() === 'get' && url.startsWith('/users/inbox/')) {
            addButtons();
        }
    });
})();