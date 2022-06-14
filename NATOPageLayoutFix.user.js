// ==UserScript==
// @name         NATO Page Layout Fix
// @description  Makes Layout on NATO page consistent by removing the table structure and replacing it with grid layout. Also add easy VLQ and NAA flag buttons
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.0.0
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
            table: 'table.default-view-post-table',
            answerLink: 'a.answer-hyperlink',
            postBody: 'div.s-prose.js-post-body',
            relativeTime: 'span.relativetime'
        },
        css: {
            container: 'grid-nato-display',
            rowCell: 'nato-grid-row',
            answerHyperlink: 'answer-hyperlink',
            // needed for inline editing
            answer: 'answer',
            answerCell: 'answercell',
            // needed for Natty in AF
            questionTime: 'nato-question-time',
            userInfo: 'user-info'
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
                grid-template-columns: calc(100% - 172px - var(--su-static24));
                width: 100% !important;
            }
        
            .${config.css.container} > .${config.css.rowCell} {
                padding: 5px;
                border-bottom: 1px dotted silver;
                padding-bottom: 10px;
            }
            .${config.css.rowCell} > .${config.css.questionTime} {
                margin-left: 5px;
            }
        `;
        document.head.append(style);
    };
    const rebuildNATOLayout = () => {
        $(`${config.selector.mainbar}`).attr('class', config.css.container);
        const table = $(`${config.selector.table}`);
        $(`${config.selector.table} > tbody > tr`).each((idx, tr) => {
            const tds = $(tr).find('td');
            const answerNode = $(tds[0]);
            const rightTd = $(tds[1]);
            const userCard = rightTd.find(`div.${config.css.userInfo}`);
            userCard.find('a').attr('target', '_blank');
            const questionTime = rightTd.find(`> ${config.selector.relativeTime}`);
            questionTime.addClass(config.css.questionTime);

            // Answer Link
            const answerLink = answerNode.find(`> ${config.selector.answerLink}`);
            answerLink.removeClass(config.css.answerHyperlink);
            answerLink.attr('target', '_blank');
            const answerId = answerLink.attr('href').split('#')[1];

            // Build New Container for Answer Body and Answer Controls
            const answerWrapper = $(`<div class="${config.css.answer}"  data-answerid="${answerId}">`);
            const answerCell = $(`<div class="${config.css.answerCell}"/>`);
            // Answer Body
            const answerBody = answerNode.find(`> ${config.selector.postBody}`);
            answerCell.append(answerBody);
            const footer = $(`<div class="mt24">
    <div class="d-flex fw-wrap ai-start jc-end gs8 gsy">
        <div class="flex--item mr16" style="flex: 1 1 100px;">
            <div class="js-post-menu pt2" data-post-id="${answerId}">
                <div class="d-flex gs8 s-anchors s-anchors__muted fw-wrap">
                    <div class="flex--item">
                        <a href="/posts/${answerId}/edit" class="js-edit-post"
                           title="Revise and improve this post">Edit</a>
                    </div>
                    <div class="flex--item">
                        <button type="button" class="js-flag-post-link s-btn s-btn__link"
                                title="Flag this post for serious problems or moderator attention">
                            Flag
                        </button>
                    </div>
                </div>
                <div class="js-menu-popup-container"></div>
            </div>
        </div>
        <div class="post-signature flex--item fl0"></div>
    </div>
</div>`);
            footer.find('div.post-signature').append(userCard);
            answerCell.append(footer);
            answerWrapper.append(answerCell);

            // Top Level component
            const NATOWrapper = $(`<div class="${config.css.rowCell}"/>`);
            NATOWrapper.append(answerLink);
            NATOWrapper.append(questionTime);
            NATOWrapper.append(answerWrapper);
            // Add to DOM
            NATOWrapper.insertBefore(table);
        });
        table.remove();
        // Create Click Listener for Flag Button
        StackExchange.vote_closingAndFlagging.init();
        // Create inline editor support
        StackExchange.inlineEditing.init();
    };

    const enableCodeSupport = () => {
        // Some Syntax Highlighting
        StackExchange.using('highlightjs', () => {
            StackExchange.highlightjs.instance.highlightAll();
        });
        // Make snippets runnable
        StackExchange.snippets.init();
    };


    StackExchange.ready(() => {
        buildStyle();
        rebuildNATOLayout();
        enableCodeSupport();
    });
}());