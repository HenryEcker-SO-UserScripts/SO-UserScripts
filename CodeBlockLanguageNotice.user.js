// ==UserScript==
// @name         Code Block Language Notices
// @description  Adds indicator to code blocks that displays what language the code block is actually being highlighted with
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.3
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/CodeBlockLanguageNotice.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/CodeBlockLanguageNotice.user.js
//
// @match        *://*.askubuntu.com/questions/*
// @match        *://*.serverfault.com/questions/*
// @match        *://*.stackapps.com/questions/*
// @match        *://*.stackexchange.com/questions/*
// @match        *://*.stackoverflow.com/questions/*
// @match        *://*.superuser.com/questions/*
// @match        *://*.mathoverflow.net/questions/*
//
// @exclude      *://*.askubuntu.com/questions/ask*
// @exclude      *://*.mathoverflow.net/questions/ask*
// @exclude      *://*.serverfault.com/questions/ask*
// @exclude      *://*.stackapps.com/questions/ask*
// @exclude      *://*.stackexchange.com/questions/ask*
// @exclude      *://*.stackoverflow.com/questions/ask*
// @exclude      *://*.superuser.com/questions/ask*
// @grant        none
//
// ==/UserScript==
/* globals StackExchange, $ */

(function () {
    'use strict';

    const config = {
        classNames: {
            handledClass: 'cbln-observed-handled'
        }
    };

    function getCodeBlocks() {
        return $('.s-code-block');
    }

    function buildNotice(highlightLanguageText) {
        return $('<div style="position: relative;height: 1.1rem;"></div>')
            .append(
                $('<div style="position: absolute;left: -9px;top: -9px;" class="ba bar-sm p2 o50"></div>')
                    .append(`<span title="This code block is highlighted using the rules for ${highlightLanguageText}">${highlightLanguageText}</span>`)
            );
    }

    function getLanguageIdentifierFromClassName(languageClassName) {
        return languageClassName.split('-').at(-1);
    }

    function handleAddNotice(jPreBlock, languageClassName) {
        jPreBlock.prepend(buildNotice(getLanguageIdentifierFromClassName(languageClassName)));
    }

    function filterClasses(className) {
        return className.startsWith('language-');
    }

    function processMutationTarget(target) {
        const filteredClasses = [...target.classList].filter(filterClasses);
        return {
            jPreBlock: $(target).parent(),
            languageClassName: filteredClasses[0]
        };
    }


    const hljsClassObserver = new MutationObserver((mutationList, observer) => {
        for (const mutation of mutationList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const {jPreBlock, languageClassName} = processMutationTarget(mutation.target);

                if (languageClassName !== undefined && !jPreBlock.hasClass(config.classNames.handledClass)) {
                    handleAddNotice(jPreBlock, languageClassName);
                    // Mark that we've already seen this code block (to prevent adding notice multiple times)
                    jPreBlock.addClass(config.classNames.handledClass);
                }
            }
        }
        observer.disconnect();
    });

    const observerConfig = {attributes: true};

    function handleAddCodeObservers(preBlock) {
        const codeBlock = preBlock.find('code');
        if (codeBlock.length === 1) {
            hljsClassObserver.observe(codeBlock[0], observerConfig);
        }
    }


    function main() {
        getCodeBlocks().each((i, n) => {
            handleAddCodeObservers($(n));
        });
    }

    StackExchange.ready(() => {
        // Only run on sights with hljs
        StackExchange.ifUsing('highlightjs', () => {
            main();
        });
    });
})();