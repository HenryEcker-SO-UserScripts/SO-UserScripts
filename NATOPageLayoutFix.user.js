// ==UserScript==
// @name         NATO Page Layout Fix
// @description  Makes Layout on NATO page consistent by removing the table structure and replacing it with grid layout. Also add easy VLQ and NAA flag buttons
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.0.7
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
            relativeTime: 'span.relativetime',
            jsFollowAnswer: '.js-follow-answer'
        },
        css: {
            container: 'grid-nato-display',
            rowCell: 'nato-grid-row',
            answerHyperlink: 'answer-hyperlink',
            deletedAnswer: 'deleted-answer',
            updownvote: 'votecell',
            questionTitle: 'nato-question-title',
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
            :root {
                --nato-fix-border-style: 1px dotted silver
            }
            
            .${config.css.container} {
                display: flex;
                flex-direction: column;
                flex-wrap: nowrap;
                gap: 10px;
                width: 100% !important;
            }
            
            .${config.css.container} > .${config.css.rowCell} {
                padding: 10px;
                border: var(--nato-fix-border-style);
                
                display: grid;
                grid-template-areas: 'questionTitle questionTitle'
                                     'questionTime  questionTime'
                                     'voteComponent answerComponent';
                grid-template-rows: min-content min-content 1fr;
                grid-template-columns: 50px calc(100% - 54px);
                grid-gap: 2px;
            }
            
            .${config.css.rowCell} > .${config.css.updownvote} {
                grid-area: voteComponent;
            }
            
            .${config.css.rowCell} > .${config.css.answer} {
                grid-area: answerComponent;
            }
            
            .${config.css.rowCell} > .${config.css.questionTitle} {
                grid-area: questionTitle;
            }
            
            .${config.css.rowCell} > .${config.css.questionTime} {
                border-bottom: var(--nato-fix-border-style);
                grid-area: questionTime;
            }
            
            .${config.css.rowCell} > .${config.css.deletedAnswer} {
                margin: 0 !important;
                padding-left: 5px !important;
            }
        `;
        document.head.append(style);
    };

    const pullDownAndHighlightPostVotes = async (answerIdSet) => {
        // Highlight Existing Votes
        let votes = [];
        for (const answerId of answerIdSet) {
            const response = await fetch(`/posts/${answerId}/votes`);
            if (response.status === 200) {
                const resData = await response.json();
                // Update UI as we go
                votes = [...votes, ...resData];
            }
            await new Promise((resolve) => {
                return setTimeout(resolve, 75);
            });
        }
        StackExchange.vote.vote_init(votes);
    };

    const rebuildNATOLayout = () => {
        $(`${config.selector.mainbar}`).attr('class', config.css.container);
        const table = $(`${config.selector.table}`);
        const answerIdSet = new Set();
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
            answerLink.addClass(config.css.questionTitle);
            answerLink.attr('target', '_blank');
            const answerId = answerLink.attr('href').split('#')[1];
            answerIdSet.add(answerId);

            const voteComponent = $(`<div class="${config.css.updownvote}">
    <div class="js-voting-container d-flex jc-center fd-column ai-stretch gs4 fc-black-200" data-post-id="${answerId}">
        <button class="js-vote-up-btn flex--item s-btn s-btn__unset c-pointer " data-controller="s-tooltip" data-s-tooltip-placement="right" aria-pressed="false" aria-label="Up vote" data-selected-classes="fc-theme-primary" data-unselected-classes="" aria-describedby="--stacks-s-tooltip-y2hsdqmt">
            <svg aria-hidden="true" class="svg-icon iconArrowUpLg" width="36" height="36" viewBox="0 0 36 36"><path d="M2 25h32L18 9 2 25Z"></path></svg>
        </button>
        <div id="--stacks-s-tooltip-y2hsdqmt" class="s-popover s-popover__tooltip pe-none wmx2" aria-hidden="true" role="tooltip" style="">This answer is useful<div class="s-popover--arrow" style=""></div></div>
        <div class="js-vote-count flex--item d-flex fd-column ai-center fc-black-500 fs-title c-pointer" itemprop="upvoteCount" data-value="0" role="button" tabindex="0" data-s-tooltip-placement="right" data-controller="null s-tooltip" aria-describedby="--stacks-s-tooltip-40anz2cd">
            ?
        </div>
        <div id="--stacks-s-tooltip-40anz2cd" class="s-popover s-popover__tooltip pe-none wmx2" aria-hidden="true" role="tooltip" style="">View upvote and downvote totals.<div class="s-popover--arrow" style=""></div></div>
        <button class="js-vote-down-btn flex--item s-btn s-btn__unset c-pointer " data-controller="s-tooltip" data-s-tooltip-placement="right" aria-pressed="false" aria-label="Down vote" data-selected-classes="fc-theme-primary" data-unselected-classes="" aria-describedby="--stacks-s-tooltip-ffktvdj5">
            <svg aria-hidden="true" class="svg-icon iconArrowDownLg" width="36" height="36" viewBox="0 0 36 36"><path d="M2 11h32L18 27 2 11Z"></path></svg>
        </button><div id="--stacks-s-tooltip-ffktvdj5" class="s-popover s-popover__tooltip pe-none" aria-hidden="true" role="tooltip">This answer is not useful<div class="s-popover--arrow"></div></div>
        <a class="js-post-issue flex--item s-btn s-btn__unset c-pointer py6 mx-auto" href="/posts/${answerId}/timeline" data-shortcut="T" data-ks-title="timeline" data-controller="s-tooltip" data-s-tooltip-placement="right" aria-label="Timeline" aria-describedby="--stacks-s-tooltip-dzfovtel"><svg aria-hidden="true" class="mln2 mr0 svg-icon iconHistory" width="19" height="18" viewBox="0 0 19 18"><path d="M3 9a8 8 0 1 1 3.73 6.77L8.2 14.3A6 6 0 1 0 5 9l3.01-.01-4 4-4-4h3L3 9Zm7-4h1.01L11 9.36l3.22 2.1-.6.93L10 10V5Z"></path></svg></a><div id="--stacks-s-tooltip-dzfovtel" class="s-popover s-popover__tooltip pe-none" aria-hidden="true" role="tooltip">Show activity on this post.<div class="s-popover--arrow"></div></div>

    </div>

</div>`);

            // Build New Container for Answer Body and Answer Controls
            const answerWrapper = $(`<div class="${config.css.answer}"  data-answerid="${answerId}">`);
            const answerCell = $(`<div class="${config.css.answerCell}"/>`);
            // Answer Body
            const answerBody = answerNode.find(`> ${config.selector.postBody}`);
            if (answerBody.hasClass(config.css.deletedAnswer)) {
                answerBody.removeClass(config.css.deletedAnswer);
                answerWrapper.addClass(config.css.deletedAnswer);
            }
            answerCell.append(answerBody);
            const footer = $(`<div class="mt24">
    <div class="d-flex fw-wrap ai-start jc-end gs8 gsy">
        <div class="flex--item mr16" style="flex: 1 1 100px;">
            <div class="js-post-menu pt2" data-post-id="${answerId}">
                <div class="d-flex gs8 s-anchors s-anchors__muted fw-wrap">
                    <div class="flex--item">
                        <a href="/a/${answerId}/${StackExchange.options.user.userId}"
                           rel="nofollow"
                           itemprop="url"
                           class="js-share-link"
                           title="Short permalink to this answer"
                           data-controller="se-share-sheet s-popover"
                           data-se-share-sheet-title="Share a link to this answer"
                           data-se-share-sheet-subtitle="(includes your user id)"
                           data-se-share-sheet-post-type="answer"
                           data-se-share-sheet-social="facebook twitter" 
                           data-se-share-sheet-location="2"
                           data-se-share-sheet-license-url="https%3a%2f%2fcreativecommons.org%2flicenses%2fby-sa%2f4.0%2f"
                           data-se-share-sheet-license-name="CC BY-SA 4.0"
                           data-s-popover-placement="bottom-start" 
                           aria-controls="se-share-sheet-10"
                           data-action=" s-popover#toggle se-share-sheet#preventNavigation s-popover:show->se-share-sheet#willShow s-popover:shown->se-share-sheet#didShow">
                            Share
                        </a>
                    </div>
                    <div class="flex--item">
                        <a href="/posts/${answerId}/edit" class="js-edit-post"
                           title="Revise and improve this post">Edit</a>
                    </div>
                    <div class="flex--item">
                        <button type="button"
                                id="btnFollowPost-${answerId}" 
                                class="s-btn s-btn__link js-follow-post js-follow-question"
                                data-gps-track=""
                                data-controller="s-tooltip " data-s-tooltip-placement="bottom"
                                data-s-popover-placement="bottom" aria-controls=""
                                title="Follow this question to receive notifications">
                            Follow
                        </button>
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
            NATOWrapper.append(voteComponent);
            NATOWrapper.append(answerWrapper);
            // Add to DOM
            NATOWrapper.insertBefore(table);
        });
        table.remove();
        // Enable Share Links
        StackExchange.question.initShareLinks();
        // Create inline editor support
        StackExchange.inlineEditing.init();
        // Support for Follow
        StackExchange.vote.follow_init();
        // Create Click Listener for Flag Button
        StackExchange.vote_closingAndFlagging.init();

        // Enable Fetch Vote Counts
        StackExchange.vote.bindFetchVoteCounts();

        // Background pull votes on the post and highlight (Voting button UIs update: Follow button becomes Following, etc.)
        void pullDownAndHighlightPostVotes(answerIdSet);
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