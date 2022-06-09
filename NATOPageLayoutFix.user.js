// ==UserScript==
// @name         NATO Page Layout Fix
// @description  Makes Layout on NATO page consistent by removing the table structure and replacing it with grid layout
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.2
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
/* globals $, StackExchange */

(function () {
    'use strict';

    const config = {
        selector: {
            mainbar: '#mainbar',
            table: '.default-view-post-table'
        },
        css: {
            container: 'grid-nato-display',
            rowCell: 'nato-grid-row'
        }
    };

    const buildStyle = () => {
        const style = document.createElement('style');
        style.id = 'NATOPageLayoutStyles';
        style.innerHTML = `
            .${config.css.container} {
                display: grid;
                grid-template-columns: calc(100% - 172px - var(--su-static24)) max-content;
                width: 100% !important;
            }
        
            .${config.css.container} > .${config.css.rowCell} {
                padding: 5px;
                border-bottom: 1px dotted silver;
                padding-bottom: 10px;
                overflow: hidden;
            }
        `;
        document.head.append(style);
    };
    const rebuildNATOLayout = () => {
        $(`${config.selector.mainbar}`).attr('class', config.css.container);
        const table = $(`${config.selector.table}`);
        for (const node of $(`${config.selector.table} td`)) {
            $(`<div class="${config.css.rowCell}"/>`).html(node.children).insertBefore(table);
        }
        table.remove();
    };

    StackExchange.ready(() => {
        buildStyle();
        rebuildNATOLayout();
    });
}());