// ==UserScript==
// @name         NATO Page Layout Fix
// @description  Makes Layout on NATO page consistent by removing the table structure and replacing it with grid layout. Also add easy VLQ and NAA flag buttons
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.4
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
            table: 'table.default-view-post-table'
        },
        css: {
            container: 'grid-nato-display',
            rowCell: 'nato-grid-row',
            flagControls: 'nato-flag-controls'
        },
        flagNames: {
            NAA: 'AnswerNotAnAnswer',
            VLQ: 'PostLowQuality'
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
            
            .${config.css.container} > .${config.css.rowCell} > .${config.css.flagControls} {
               border-top:  1px dotted silver;
               padding-top: 5px;
               margin-top: 10px;
            }
        `;
        document.head.append(style);
    };
    const rebuildNATOLayout = () => {
        $(`${config.selector.mainbar}`).attr('class', config.css.container);
        const table = $(`${config.selector.table}`);
        for (const node of $(`${config.selector.table} > tbody > tr > td`)) {
            $(`<div class="${config.css.rowCell}"/>`).html(node.children).insertBefore(table);
        }
        table.remove();
    };

    const getFormDataFromObject = (obj) => {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            acc.set(key, value);
            return acc;
        }, new FormData());
    };


    const handleFlag = async (postId, flagType) => {
        const res = await fetch(`/flags/posts/${postId}/add/${flagType}`, {
            method: 'POST',
            body: getFormDataFromObject({
                'fkey': StackExchange.options.user.fkey,
                'otherText': ''
            })
        });
        const resData = await res.json();
        if (resData?.Message) {
            StackExchange.helpers.showToast(resData?.Message, {
                transient: true,
                type: 'info',
                useRawHtml: true
            });
        }
    };


    const buildFlagButtons = () => {
        $(`.${config.css.rowCell}:nth-child(odd)`).each((i, e) => {
            const div = $(e);
            const answerId = div.find('a').attr('href').split('#')[1];
            div.attr('data-answer-id', answerId);

            const vlqButton = $('<button type="button" class="s-btn s-btn__link" title="Flag this post as Very Low Quality">VLQ</button>');
            vlqButton.on('click', () => {
                void handleFlag(answerId, config.flagNames.VLQ);
            });
            const vlqWrap = $('<div class="flex--item">');
            vlqWrap.append(vlqButton);


            const naaButton = $('<button type="button" class="s-btn s-btn__link" title="Flag this post as Not an Answer">NAA</button>');
            naaButton.on('click', () => {
                void handleFlag(answerId, config.flagNames.NAA);
            });
            const naaWrap = $('<div class="flex--item">');
            naaWrap.append(naaButton);


            const wrapContainer = $('<div class="d-flex gs8 s-anchors s-anchors__muted fw-wrap"/>');
            wrapContainer.append($('<div class="flex--item"><span>Flag Options:</span></div>'));
            wrapContainer.append(vlqWrap);
            wrapContainer.append(naaWrap);

            const postMenu = $(`<div class="js-post-menu pt2" data-post-id="${answerId}"/>`);
            postMenu.append(wrapContainer);

            const controlPanel = $(`<div class="${config.css.flagControls} flex--item mr16" style="flex: 1 1 100px;"/>`);
            controlPanel.append(postMenu);

            div.append(controlPanel);
        });
    };

    StackExchange.ready(() => {
        buildStyle();
        rebuildNATOLayout();
        buildFlagButtons();
    });
}());