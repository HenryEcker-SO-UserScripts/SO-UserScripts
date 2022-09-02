// ==UserScript==
// @name         Anonymise Share Links
// @description  Adds a toggle button to all share popovers which will allow share links to exclude user ids
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.3
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/AnonymousShareLinks.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/AnonymousShareLinks.user.js
//
// @match        *://*.askubuntu.com/questions/*
// @match        *://*.serverfault.com/questions/*
// @match        *://*.stackapps.com/questions/*
// @match        *://*.stackexchange.com/questions/*
// @match        *://*.stackoverflow.com/questions/*
// @match        *://*.superuser.com/questions/*
// @match        *://*.mathoverflow.net/questions/*
//
// @grant        GM_getValue
// @grant        GM_setValue
//
//
// ==/UserScript==
/* globals $, StackExchange, Stacks */

(function () {
    'use strict';

    const config = {
        jQuerySelector: {
            shareLinks: 'a.js-share-link'
        },
        attributeName: {
            popoverSubtitle: 'data-se-share-sheet-subtitle',
            userScriptPopoverContainsUserId: 'aus-sheet-contains-user-id',
            userScriptToggleComponentId: 'aus-sheet-toggle-controller-id'
        },
        attributeValue: {
            popoverSubtitleText: '(Includes your user id)'
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
        return href.splitOnLast('/')[0];
    };

    const buildToggleComponent = (ev, popoverId, shouldInclude) => {
        const popoverCheckboxId = `${popoverId}-input`;
        const popoverToggleComponentId = `${popoverId}-toggle-component`;
        const toggleComponent = $(`<div id='${popoverToggleComponentId}' class='my8 d-flex ai-center'>
    <label class='flex--item s-label__sm fw-bold' for='${popoverCheckboxId}'>Include User Id</label>
    <div class='mx4 flex--item s-toggle-switch'>
        <input id='${popoverCheckboxId}' type='checkbox' ${shouldInclude ? 'checked' : ''}>
        <div class='s-toggle-switch--indicator'></div>
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
        return toggleComponent;
    };

    const updatePopover = (ev, shouldInclude) => {
        const currentHref = ev.detail.dispatcher.getAttribute('href');
        const hasSubtitleAttr = ev.detail.dispatcher.hasAttribute(config.attributeName.popoverSubtitle);

        if (shouldInclude) {
            // If popover missing user id add it back
            if (currentHref.match(/^\/([^/]+?)\/(\d+)$/) !== null) {
                // Update Attribute (append user id)
                ev.detail.dispatcher.setAttribute('href', appendId(currentHref));
            }
            // If popover missing subtitle add it back
            if (!hasSubtitleAttr) {
                ev.detail.dispatcher.setAttribute(
                    config.attributeName.popoverSubtitle,
                    config.attributeValue.popoverSubtitleText
                );
            }
        } else {
            // If popover has user id remove it
            if (currentHref.match(/^\/([^/]+?)\/(\d+)\/\d+$/) !== null) {
                // Update Attribute (strip user id)
                ev.detail.dispatcher.setAttribute('href', stripId(currentHref));
            }
            // If popover has subtitle remove it
            if (hasSubtitleAttr) {
                ev.detail.dispatcher.removeAttribute(
                    config.attributeName.popoverSubtitle
                );
            }
        }
    };

    const main = () => {
        document.addEventListener(config.eventName.showPopover, (ev) => {
            if (testDispatcherIsSharePopover(ev.detail?.dispatcher)) {
                // Pull down whether user id should be included
                const shouldIncludeUserId = getShouldIncludeUserId();

                // Check existing popover for UserScript attributes
                const containsUserId = ev.detail.dispatcher.getAttribute(
                    config.attributeName.userScriptPopoverContainsUserId
                );
                const toggleComponentId = ev.detail.dispatcher.getAttribute(
                    config.attributeName.userScriptToggleComponentId
                );


                // Find corresponding popover
                const popover = $(`#${ev.detail.dispatcher.getAttribute('aria-controls')}`);
                // Build toggle component
                const toggleComponent = buildToggleComponent(
                    ev, popover.attr('id'), shouldIncludeUserId
                );

                if (toggleComponentId === null) {
                    // Place toggle component after input field
                    popover.find('div.my8').after(toggleComponent);
                    // Update attribute with component id
                    ev.detail.dispatcher.setAttribute(
                        config.attributeName.userScriptToggleComponentId,
                        toggleComponent.attr('id')
                    );
                } else {
                    // Rebuild and replace with new toggle component (IDK Stacks toggle does not display correctly even with attribute changes without re-rendering)
                    $(`#${toggleComponentId}`).replaceWith(toggleComponent);
                }


                // Determine if any changes need to be made to controller attributes
                if (
                    containsUserId === null ||
                    ((containsUserId === 'true') !== shouldIncludeUserId)
                ) {
                    // Prevent popover from opening
                    ev.preventDefault();
                    // Make needed popover state changes
                    updatePopover(ev, shouldIncludeUserId);
                    // Update attribute
                    ev.detail.dispatcher.setAttribute(
                        config.attributeName.userScriptPopoverContainsUserId,
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