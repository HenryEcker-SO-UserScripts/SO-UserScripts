// ==UserScript==
// @name         Anonymise Share Links
// @description  Adds a toggle button to all share popovers which will allow share links to exclude user ids
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.7
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
// @match        *://*.askubuntu.com/review/*
// @match        *://*.serverfault.com/review/*
// @match        *://*.stackapps.com/review/*
// @match        *://*.stackexchange.com/review/*
// @match        *://*.stackoverflow.com/review/*
// @match        *://*.superuser.com/review/*
// @match        *://*.mathoverflow.net/review/*
//
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
            toggleStyleStr: 'width: 33px; height: 18px;'
        },
        attributeName: {
            popoverSubtitle: 'data-se-share-sheet-subtitle',
            userScriptPopoverContainsUserId: 'aus-sheet-contains-user-id',
            userScriptToggleComponentId: 'aus-sheet-toggle-controller-id'
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

    const buildToggleComponent = (ev, popoverId, currentHref, shouldInclude) => {
        const popoverCheckboxId = `${popoverId}-input`;
        const popoverToggleComponentId = `${popoverId}-toggle-component`;
        const toggleComponent = $(`<div id='${popoverToggleComponentId}' class='my8 d-flex ai-center'>
    <label class='flex--item s-label__sm fw-bold' for='${popoverCheckboxId}'>${config.attributeValue.toggleLabelText}</label>
    <div class='mx4 flex--item s-toggle-switch'>
        <input id='${popoverCheckboxId}' type='checkbox' ${shouldInclude ? 'checked' : ''} style='${config.css.toggleStyleStr}'>
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
            // If normally should include strip id
            // If normally should not include append id
            void copy((shouldInclude ? stripId : appendId)(
                // Expand to full URL
                new URL(currentHref, window.location.origin).href
            ));
        });

        toggleComponent.append(oneTimeButton);
        return toggleComponent;
    };

    const updatePopover = (ev, currentHref, shouldInclude, toggleComponentId) => {
        const hasSubtitleAttr = ev.detail.dispatcher.hasAttribute(config.attributeName.popoverSubtitle);

        let newHref = currentHref;

        if (shouldInclude) {
            // If popover missing user id add it back
            if (currentHref.match(/^\/([^/]+?)\/(\d+)$/) !== null) {
                // Update Attribute (append user id)
                newHref = appendId(currentHref);
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
                newHref = stripId(currentHref);
            }
            // If popover has subtitle remove it
            if (hasSubtitleAttr) {
                ev.detail.dispatcher.removeAttribute(
                    config.attributeName.popoverSubtitle
                );
            }
        }

        // Update Href to new value
        ev.detail.dispatcher.setAttribute('href', newHref);


        // Find corresponding popover
        const popover = $(`#${ev.detail.dispatcher.getAttribute('aria-controls')}`);
        // Build toggle component
        const toggleComponent = buildToggleComponent(
            ev, popover.attr('id'), newHref, shouldInclude
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

                // Determine if any changes need to be made to controller attributes
                if (
                    containsUserId === null ||
                    ((containsUserId === 'true') !== shouldIncludeUserId)
                ) {
                    // Prevent popover from opening
                    ev.preventDefault();
                    const toggleComponentId = ev.detail.dispatcher.getAttribute(
                        config.attributeName.userScriptToggleComponentId
                    );
                    const currentHref = ev.detail.dispatcher.getAttribute('href');
                    // Make needed popover state changes
                    updatePopover(ev, currentHref, shouldIncludeUserId, toggleComponentId);

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