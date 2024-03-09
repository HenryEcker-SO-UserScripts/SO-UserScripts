// ==UserScript==
// @name         10K Tools Topbar Button
// @description  Adds a Button to the topbar which gives a direct list to all 10k tool pages
// @homepage     https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.0.9
// @downloadURL  https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/10kToolsTopbarItem.user.js
// @updateURL    https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/10kToolsTopbarItem.user.js
//
// @match       *://*.askubuntu.com/*
// @match       *://*.serverfault.com/*
// @match       *://*.stackapps.com/*
// @match       *://*.stackexchange.com/*
// @match       *://*.stackoverflow.com/*
// @match       *://*.superuser.com/*
// @match       *://*.mathoverflow.net/*
//
// @exclude     *://chat.stackexchange.com/*
// @exclude     *://chat.meta.stackexchange.com/*
// @exclude     *://chat.stackoverflow.com/*
// @exclude     *://area51*.stackexchange.com/*
// @exclude     *://api.stackexchange.com/*
// @exclude     *://data.stackexchange.com/*
//
// @grant        GM_getValue
// @grant        GM_setValue
//
// ==/UserScript==
/* globals $, StackExchange */

(function () {
    'use strict';

    StackExchange.ready(() => {
        const config = {
            id: {
                popover: 'tools-popover',
                popoverBody: 'popover-body',
                tenKToolsButton: 'ten-k-tools-button'
            },
            label: {
                tenKToolsLabel: 'Moderator Tools'
            },
            css: {
                menuLink: 's-block-link tt-capitalize',
                menuTitle: 's-menu--title',
                cursorPointer: 'c-pointer',
                expandableMenu: 's-menu-expandable',
                menuSelected: 'is-open',
                isExpanded: 'is-expanded'
            },
            access: {
                tools: 'toolAccess',
                siteAnalytics: 'siteAnalyticsAccess'
            },
            icons: {
                iconArrowRightSm: $('<svg aria-hidden="true" class="svg-icon iconArrowRightSm" width="15" height="15" viewBox="0 0 15 15"><path d="M5 11V3l4 4-4 4Z"></path></svg>')
            }
        };

        const getRepThresholds = async (siteName) => {
            const apiResponseSearchValues = [{
                'key': config.access.tools,
                'short_description': 'Access moderator tools'
            }, {
                'key': config.access.siteAnalytics,
                'short_description': 'Access to site analytics'
            }];

            if (StackExchange.options.user.isModerator === true) {
                // There is no rep requirement for mods so set access threshold to the minimum rep (1)
                return apiResponseSearchValues.reduce((acc, {key}) => {
                    return {...acc, [key]: 1};
                }, {});
            }

            let repThresholds = GM_getValue(siteName);

            if (repThresholds === undefined) {
                const resData = await fetch(
                    `https://api.stackexchange.com/2.3/privileges?key=0BXFrOWQNt8HFRYCHbjdrg((&site=${siteName}`
                ).then((res) => {
                    return res.json();
                });
                repThresholds = {};
                for (const repEntry of resData.items) {
                    for (const searchEntry of apiResponseSearchValues) {
                        if (repEntry.short_description === searchEntry.short_description) {
                            repThresholds[searchEntry.key] = repEntry.reputation;
                        }
                    }
                }
                GM_setValue(siteName, JSON.stringify(repThresholds));
            } else {
                repThresholds = JSON.parse(repThresholds);
            }
            return repThresholds;
        };

        const main = async () => {
            const userRep = StackExchange.options.user.rep;

            const repThresholds = await getRepThresholds(
                StackExchange.options.site.isChildMeta === true ?
                    // Map child meta's to parent's for reputation (prevent unnecessary duplicate entries)
                    new URL(StackExchange.options.site.parentUrl).host :
                    window.location.host
            );

            if (userRep >= repThresholds[config.access.tools]) {
                const topbarButton = $(`<li>
    <button id="${config.id.tenKToolsButton}"
            class="s-topbar--item s-btn s-btn__muted"
            aria-label="${config.label.tenKToolsLabel}"
            title="${config.label.tenKToolsLabel}"
            role="menuitem"
            aria-controls="${config.id.popover}"
            data-controller="s-popover"
            data-action="s-popover#toggle"
            data-s-popover-placement="bottom-end"
            data-s-popover-toggle-class="is-selected">
        <svg aria-hidden="true" class="svg-icon iconGraph" width="18" height="18" viewBox="0 0 18 18">
            <path d="M3 1h12c1.09 0 2 .91 2 2v12c0 1.09-.91 2-2 2H3c-1.09 0-2-.91-2-2V3c0-1.1.9-2 2-2Zm1 8v5h2V9H4Zm4-5v10h2V4H8Zm4 3v7h2V7h-2Z"></path>
        </svg>
        <div class="v-visible-sr">${config.label.tenKToolsLabel}</div>
    </button>
</li>`);

                const buildHTMLStringFromCollection = (it, filterFn, mapFn) => {
                    return it.filter(filterFn).map(mapFn).join('\n');
                };
                const testConditional = (conditional) => {
                    return conditional === undefined || conditional === true;
                };
                const buildExpandable = (elemId, label, children) => {
                    const isOpen = GM_getValue(elemId) === true;
                    return `<li class="${config.css.menuTitle} ${config.css.expandableMenu} ${config.css.cursorPointer} ${isOpen ? config.css.menuSelected : ''}" 
                                role="separator" 
                                data-controller="s-expandable-control"
                                data-s-expandable-control-toggle-class="${config.css.menuSelected}"
                                aria-controls="${elemId}">
                                ${label}
                            </li>
                            <div class="s-expandable ${isOpen ? config.css.isExpanded : ''}" id="${elemId}">
                                <div class="s-expandable--content">
                                    ${children}
                                </div>
                            </div>`;
                };
                const buildAllExpandables = (expandables) => {
                    return buildHTMLStringFromCollection(
                        Object.entries(expandables),
                        ([_label, {conditional}]) => {
                            return testConditional(conditional);
                        },
                        ([label, {children}], index) => {
                            return buildExpandable(
                                `ten-k-tools-expandable-${index}`,
                                label,
                                buildHTMLStringFromCollection(
                                    children,
                                    ({conditional}) => {
                                        return testConditional(conditional);
                                    },
                                    ({href, text}) => {
                                        return `<li role="menuitem"><a href="${href}" class="${config.css.menuLink}">${text}</a></li>`;
                                    }
                                )
                            );
                        }
                    );
                };

                const topbarDialogue = $(`<li role="presentation">
    <div class="topbar-dialog" id="${config.id.popover}" role="menu">
        <div class="header fw-wrap">
            <h3 class="flex--item">${config.label.tenKToolsLabel}</h3>
            <div class="flex--item fl1">
                <div class="ai-center d-flex jc-end">
                    <div class="-right">
                        <a href="https://stackoverflow.com/tools">Tools</a>
                    </div>
                    <button class="js-close-button flex--item s-btn s-btn__muted p0 ml8 d-none sm:d-block" type="button" aria-label="Close">
                        <svg aria-hidden="true" class="svg-icon iconClear" width="18" height="18" viewBox="0 0 18 18"><path d="M15 4.41 13.59 3 9 7.59 4.41 3 3 4.41 7.59 9 3 13.59 4.41 15 9 10.41 13.59 15 15 13.59 10.41 9 15 4.41Z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
        <div id="${config.id.popoverBody}" class="px4 py4 overflow-y-auto">
            <ul class="s-menu" role="menu">
                ${buildAllExpandables({
                    'reports': {
                        children: [
                            {
                                href: '/tools/new-answers-old-questions',
                                text: 'new answers to old questions'
                            },
                            {
                                href: '/tools/protected-questions',
                                text: 'protected questions'
                            }

                        ]
                    },
                    'anonymous and low rep post feedback': {
                        children: [
                            {
                                href: '/tools/post-feedback?filter=day',
                                text: 'anonymous and low rep post feedback'
                            },
                            {
                                href: '/tools/post-feedback/underrated?filter=day',
                                text: 'underrated'
                            },
                            {
                                href: '/tools/post-feedback/overrated?filter=day',
                                text: 'overrated'
                            },
                            {
                                href: '/tools/post-feedback/most-helpful?filter=day',
                                text: 'most helpful'
                            },
                            {
                                href: '/tools/post-feedback/least-helpful?filter=day',
                                text: 'least helpful'
                            }
                        ]
                    },
                    'tags': {
                        children: [
                            {href: '/tags/synonyms', text: 'tag synonyms'},
                            {href: '/tags?tab=new', text: 'new tags'}
                        ]
                    },
                    'close/migration/delete stats': {
                        children: [
                            {
                                href: '/tools/question-close-stats',
                                text: 'question close stats'
                            },
                            {
                                href: '/tools?tab=stats',
                                text: 'stats'
                            },
                            {
                                href: '/tools?tab=migrated',
                                text: 'migrated'
                            },
                            {
                                href: '/tools?tab=close',
                                text: 'closed'
                            },
                            {
                                href: '/tools?tab=delete',
                                text: 'deleted'
                            }
                        ]
                    },
                    'Annotated Posts': {
                        children: [
                            {
                                'href': '/annotated-posts?tab=locked',
                                'text': 'All Locked'
                            },
                            {
                                'href': '/annotated-posts?tab=locked&filter=migrated',
                                'text': 'Migrated'
                            },
                            {
                                'href': '/annotated-posts?tab=locked&filter=duplicate',
                                'text': 'Locked Duplicate'
                            },
                            {
                                'href': '/annotated-posts?tab=locked&filter=merged',
                                'text': 'Merged'
                            },
                            {
                                'href': '/annotated-posts?tab=locked&filter=noticed',
                                'text': 'Noticed (Locked)'
                            },
                            {
                                'href': '/annotated-posts?tab=noticed',
                                'text': 'Noticed (Not Locked)'
                            },
                            {
                                'href': '/annotated-posts?tab=locked&filter=other',
                                'text': 'Locked Other'
                            }
                        ]
                    },
                    'suggested edit stats': {
                        children: [
                            {
                                'href': '/tools/suggested-edits?tab=all',
                                'text': 'suggested edit stats'
                            },
                            {
                                'href': '/tools/suggested-edits?tab=approved',
                                'text': 'approved'
                            },
                            {
                                'href': '/tools/suggested-edits?tab=rejected',
                                'text': 'rejected'
                            },
                            {
                                'href': '/tools/suggested-edits?tab=controversial',
                                'text': 'controversial'
                            },
                            {
                                'href': '/tools/suggested-edits?tab=anonymous',
                                'text': 'anonymous'
                            },
                            {
                                'href': '/tools/suggested-edits?tab=improved',
                                'text': 'improved'
                            }
                        ]
                    },
                    analytics: {
                        conditional: userRep >= repThresholds[config.access.siteAnalytics],
                        children: [
                            {
                                href: '/site-analytics',
                                text: 'site analytics'
                            }
                        ]
                    }
                })}
            </ul>
        </div>
    </div>
</li>`);

                const addStyleSheet = () => {
                    const style = document.createElement('style');
                    style.id = '10k-tools-topbar-styles';
                    style.innerHTML = `#${config.id.popover} {
  margin-top: -10px !important;
}

#${config.id.popoverBody} {
   max-height: 80vh;
}

#${config.id.popover}:not(.is-visible) {
  display: none;
}

.${config.css.menuTitle}.${config.css.expandableMenu}.${config.css.menuSelected} > svg {
    transform: rotate(90deg);
}

#${config.id.tenKToolsButton}:focus {
  box-shadow: none;
}`;
                    document.head.appendChild(style);
                };

                const addTopbarButton = () => {
                    const mountAfter = $('#review-button').closest('li');
                    mountAfter.after(topbarButton);
                    topbarButton.after(topbarDialogue);
                };

                const addIcons = () => {
                    $(`.${config.css.menuTitle}.${config.css.expandableMenu}`).prepend(config.icons.iconArrowRightSm);
                };

                const attachPrefListeners = () => {
                    $(`.${config.css.menuTitle}.${config.css.expandableMenu}`).on('click', (ev) => {
                        const storageKey = ev.target.getAttribute('aria-controls');
                        const openState = ev.target.getAttribute('aria-expanded') === 'false';
                        GM_setValue(storageKey, openState);
                    });
                };

                addStyleSheet();
                addTopbarButton();
                addIcons();
                attachPrefListeners();
            }
        };
        void main();
    });
})();