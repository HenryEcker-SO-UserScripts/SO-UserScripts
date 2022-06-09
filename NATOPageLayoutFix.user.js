// ==UserScript==
// @name         NATO Page Layout Fix
// @description  Makes Layout on NATO page consistent by removing the table structure and replacing it with grid layout
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.1
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/NATOPageLayoutFix.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/NATOPageLayoutFix.user.js
//
// @match        *://*.askubuntu.com/tools/new-answers-old-questions*
// @match        *://*.serverfault.com/tools/new-answers-old-questions*
// @match        *://*.stackapps.com/tools/new-answers-old-questions*
// @match        *://*.stackexchange.com/tools/new-answers-old-questions*
// @match        *://*.stackoverflow.com/tools/new-answers-old-questions*
// @match        *://*.superuser.com/tools/new-answers-old-questions*
// @match        *://*.mathoverflow.net/tools/new-answers-old-questions*
//
// @grant        none
//
// ==/UserScript==
/* globals $ */

(function () {
    'use strict';

    const mainbarSelector = '#mainbar';
    const tableSelector = '.default-view-post-table';
    const containerClass = 'grid-nato-display';
    const rowClass = 'nato-grid-row';

    const style = document.createElement('style');
    style.id = 'NATOPageLayoutStyles';
    style.innerHTML = `
    .${containerClass} {
        display: grid;
        grid-template-columns: calc(100% - 300px - var(--su-static24)) max-content;
        width: 100% !important;
    }

    .${containerClass} .${rowClass} {
        padding: 5px;
        border-bottom: 1px dotted silver;
        padding-bottom: 10px;
    }
    `;
    document.head.append(style);

    $(`${tableSelector} td`).replaceWith((i, e) => {
        return $(`<div class="${rowClass}"/>`).append(e);
    });

    $(`${tableSelector}`).replaceWith(() => {
        return $(`${tableSelector} div.${rowClass}`);
    });

    $(`${mainbarSelector}`).attr('class', containerClass);
}());