// ==UserScript==
// @name         Anonymise Share Links
// @description  Adds a toggle button to all share popovers which will allow share links to exclude user ids
// @homepage     https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.11
// @downloadURL  https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/AnonymousShareLinks.user.js
// @updateURL    https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/AnonymousShareLinks.user.js
//
// @match        *://*.askubuntu.com/questions/*
// @match        *://*.serverfault.com/questions/*
// @match        *://*.stackapps.com/questions/*
// @match        *://*.stackexchange.com/questions/*
// @match        *://*.stackoverflow.com/questions/*
// @match        *://*.superuser.com/questions/*
// @match        *://*.mathoverflow.net/questions/*
//
// @match        *://*.askubuntu.com/review/*
// @match        *://*.serverfault.com/review/*
// @match        *://*.stackapps.com/review/*
// @match        *://*.stackexchange.com/review/*
// @match        *://*.stackoverflow.com/review/*
// @match        *://*.superuser.com/review/*
// @match        *://*.mathoverflow.net/review/*
//
// @exclude      *://*.askubuntu.com/questions/ask*
// @exclude      *://*.mathoverflow.net/questions/ask*
// @exclude      *://*.serverfault.com/questions/ask*
// @exclude      *://*.stackapps.com/questions/ask*
// @exclude      *://*.stackexchange.com/questions/ask*
// @exclude      *://*.stackoverflow.com/questions/ask*
// @exclude      *://*.superuser.com/questions/ask*
// @exclude      /^https?:\/\/.*((askubuntu|serverfault|stackapps|stackexchange|stackoverflow|superuser)\.com|mathoverflow\.net)\/review\/.*\/(stats|history)/
//
// @grant        GM_getValue
// @grant        GM_setValue
//
//
// ==/UserScript==
/* globals $, StackExchange, Stacks, __tr */

(function () {
    'use strict';

    const config = {
        jQuerySelector: {
            shareLinks: 'a.js-share-link'
        },
        css: {
            toggleStyleStr: 'width: 29px; height: 16px;'
        },
        attributeName: {
            popoverSubtitle: 'data-se-share-sheet-subtitle',
            userScript: {
                popoverContainsUserId: 'aus-sheet-contains-user-id',
                toggleComponentId: 'aus-sheet-toggle-controller-id',
                toggleCheckboxId: 'aus-sheet-toggle-checkbox-id',
                linkWithUserId: 'aus-sheet-user-id-share-link',
                linkWithoutUserId: 'aus-sheet-anon-share-link'
            }
        },
        attributeValue: {
            popoverSubtitleText: '(Includes your user id)',
            toggleLabelText: 'Include user id',
            onetimeAnonymousLabelText: 'anonymous link',
            onetimeUserIdLabelText: 'link with id'
        },
        eventName: {
            showPopover: 's-popover:show'
        },
        gmStorageKey: 'shouldIncludeUserId'
    };

    const getShouldIncludeUserId = () => {
        return GM_getValue(config.gmStorageKey, 'true') === 'true';
    };

    const testDispatcherIsSharePopover = (dispatcher) => {
        return (
            dispatcher !== undefined &&
            dispatcher.matches(config.jQuerySelector.shareLinks)
        );
    };

    const getUserId = () => {
        return StackExchange.options.user.userId;
    };

    const appendId = (href) => {
        return `${href}/${getUserId()}`;
    };

    const stripId = (href) => {
        return href.splitOnLast('/')[0]; // Implemented in SE's JavaScript
    };


    const qualifyRelativeLink = (relativeLink) => {
        return new URL(relativeLink, window.location.origin).href;
    };

    const getLink = (currentHref, withUserId) => {
        if (withUserId) {
            // If popover missing user id add it back
            if (currentHref.match(/^\/([^/]+?)\/(\d+)$/) !== null) {
                // Update Attribute (append user id)
                return qualifyRelativeLink(appendId(currentHref));
            }
        } else {
            // If popover has user id remove it
            if (currentHref.match(/^\/([^/]+?)\/(\d+)\/\d+$/) !== null) {
                // Update Attribute (strip user id)
                return qualifyRelativeLink(stripId(currentHref));
            }
        }
        return qualifyRelativeLink(currentHref);
    };

    // Copy Logic Modified From SE's copy logic
    const tryCopy = (value) => {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(value);
        } else {
            let copied;

            try {
                copied = document.execCommand('copy');
            } catch (_) {
                copied = false;
            }

            const deferred = $.Deferred();

            if (copied) {
                deferred.resolve();
            } else {
                deferred.reject();
            }

            return deferred.promise();
        }
    };

    const copy = (value) => {
        tryCopy(value).then(
            () => {
                StackExchange.helpers.showToast(
                    __tr(['Link copied to clipboard.'], undefined, 'en', []),
                    {transientTimeout: 3000, type: 'success'}
                );
            },
            () => {
                StackExchange.helpers.showToast(
                    __tr(['Could not copy link to clipboard.'], undefined, 'en', []),
                    {transientTimeout: 5000, type: 'danger'}
                );
            }
        );
    };

    const buildToggleComponent = (ev, popoverCheckboxId, popoverToggleComponentId, shouldInclude) => {
        const toggleComponent = $(`<div id='${popoverToggleComponentId}' class='my8 d-flex ai-center'>
    <label class='flex--item s-label__sm fw-bold' for='${popoverCheckboxId}'>${config.attributeValue.toggleLabelText}</label>
    <div class='mx8 flex--item s-toggle-switch d-flex ai-center jc-center'>
        <input id='${popoverCheckboxId}' type='checkbox' ${shouldInclude ? 'checked' : ''} style='${config.css.toggleStyleStr} position:absolute;'>
        <div class='s-toggle-switch--indicator' style='${config.css.toggleStyleStr}'></div>
    </div>
</div>`);

        const checkbox = toggleComponent.find(`#${popoverCheckboxId}`);
        checkbox.on('input', (inputEv) => {
            const newShouldInclude = inputEv.target.checked;
            // Update Storage Item
            GM_setValue(config.gmStorageKey, `${newShouldInclude}`);
            // Refresh Popover
            Stacks.hidePopover(ev.detail.dispatcher);
            Stacks.showPopover(ev.detail.dispatcher);
        });


        const oneTimeButton = $(`<button class="js-copy-link-btn s-btn s-btn__link ml-auto">
Copy ${shouldInclude ? config.attributeValue.onetimeAnonymousLabelText : config.attributeValue.onetimeUserIdLabelText}
</button>`);

        oneTimeButton.on('click', () => {
            // If normally should include use link without id
            // If normally should not include use link with id
            void copy(
                ev.detail.dispatcher.getAttribute(
                    !shouldInclude ?
                        config.attributeName.userScript.linkWithUserId :
                        config.attributeName.userScript.linkWithoutUserId
                )
            );
        });

        toggleComponent.append(oneTimeButton);
        return toggleComponent;
    };

    const updatePopover = (ev, shouldInclude) => {
        /* Update HREF in share-sheet */
        ev.detail.dispatcher.setAttribute(
            'href',
            ev.detail.dispatcher.getAttribute(
                shouldInclude ?
                    config.attributeName.userScript.linkWithUserId :
                    config.attributeName.userScript.linkWithoutUserId
            )
        );
        /* Update Subtitle in share-sheet */
        const hasSubtitleAttr = ev.detail.dispatcher.hasAttribute(config.attributeName.popoverSubtitle);
        if (shouldInclude) {
            // If popover missing subtitle add it back
            if (!hasSubtitleAttr) {
                ev.detail.dispatcher.setAttribute(
                    config.attributeName.popoverSubtitle,
                    config.attributeValue.popoverSubtitleText
                );
            }
        } else {
            // If popover has subtitle remove it
            if (hasSubtitleAttr) {
                ev.detail.dispatcher.removeAttribute(
                    config.attributeName.popoverSubtitle
                );
            }
        }

        /* Build and Replace Toggle Component */
        const toggleComponentId = ev.detail.dispatcher.getAttribute(config.attributeName.userScript.toggleComponentId);
        $(`#${toggleComponentId}`).replaceWith(
            buildToggleComponent(
                ev,
                ev.detail.dispatcher.getAttribute(config.attributeName.userScript.toggleCheckboxId),
                toggleComponentId,
                shouldInclude
            )
        );
    };

    const main = () => {
        document.addEventListener(config.eventName.showPopover, (ev) => {
            if (testDispatcherIsSharePopover(ev.detail?.dispatcher)) {
                // Pull down whether user id should be included
                const shouldIncludeUserId = getShouldIncludeUserId();

                // Check existing popover for UserScript attributes
                const containsUserId = ev.detail.dispatcher.getAttribute(
                    config.attributeName.userScript.popoverContainsUserId
                );

                const currentHref = ev.detail.dispatcher.getAttribute('href');

                // Set up attributes on inital build only
                if (containsUserId === null) {
                    ev.detail.dispatcher.setAttribute(
                        config.attributeName.userScript.linkWithUserId,
                        getLink(currentHref, true)
                    );
                    ev.detail.dispatcher.setAttribute(
                        config.attributeName.userScript.linkWithoutUserId,
                        getLink(currentHref, false)
                    );
                    // Find corresponding popover
                    const popover = $(`#${ev.detail.dispatcher.getAttribute('aria-controls')}`);
                    const popoverId = popover.attr('id');
                    const popoverCheckboxId = `${popoverId}-input`;
                    const popoverToggleComponentId = `${popoverId}-toggle-component`;

                    // Place div in correct point to mount toggle element
                    popover.find('div.my8').after($(`<div id="${popoverToggleComponentId}"></div>`));

                    // Update attribute with ids
                    ev.detail.dispatcher.setAttribute(
                        config.attributeName.userScript.toggleCheckboxId,
                        popoverCheckboxId
                    );
                    ev.detail.dispatcher.setAttribute(
                        config.attributeName.userScript.toggleComponentId,
                        popoverToggleComponentId
                    );
                }

                // Determine if any changes need to be made to component
                if (
                    (containsUserId === null) ||
                    ((containsUserId === 'true') !== shouldIncludeUserId)
                ) {
                    // Prevent popover from opening
                    ev.preventDefault();

                    // Make needed popover state changes
                    updatePopover(ev, shouldIncludeUserId);

                    // Update attribute
                    ev.detail.dispatcher.setAttribute(
                        config.attributeName.userScript.popoverContainsUserId,
                        shouldIncludeUserId
                    );
                    // Now Show Popover
                    Stacks.showPopover(ev.detail.dispatcher);
                }
            }
        });
    };

    StackExchange.ready(() => {
        if (getUserId() !== undefined) {
            main();
        }
    });
})();