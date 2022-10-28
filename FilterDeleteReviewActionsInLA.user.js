// ==UserScript==
// @name         Filter Delete Review Actions in LA
// @description  Only shows Delete and Recommend Deletion actions (for posts which are not deleted)
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.2
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/FilterDeleteReviewActionsInLA.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/FilterDeleteReviewActionsInLA.user.js
//
// @match        *://stackoverflow.com/review/late-answers/history
// @match        *://stackoverflow.com/review/late-answers/history?*
//
// @grant        none
//
// ==/UserScript==
/* globals  $ */


(function () {
    'use strict';
    $('#content table tr:gt(0)').filter((i, n) => {
        const e = $(n);
        const action = e.find('td:eq(2)');

        // Make link modifications
        const link = action.find('a');
        link.attr('target', '_blank');
        link.on('click', () => {
            // Keep track of which links have already been clicked
            link.addClass('bg-red-500');
        });

        const actionText = action.text().trim().toLowerCase();
        const isDeleted = e.find('.iconTrashSm').length > 0;
        return isDeleted || !actionText.contains('delet');
    }).remove();
})();