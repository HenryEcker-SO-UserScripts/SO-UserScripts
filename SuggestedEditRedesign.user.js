// ==UserScript==
// @name         Suggested Edit Redesign
// @description  A number of very small tweaks to make suggested edits easier to review
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.2
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/SuggestedEditRedesign.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/SuggestedEditRedesign.user.js
//
// @match        *://*.askubuntu.com/review/suggested-edits*
// @match        *://*.serverfault.com/review/suggested-edits*
// @match        *://*.stackapps.com/review/suggested-edits*
// @match        *://*.stackexchange.com/review/suggested-edits*
// @match        *://*.stackoverflow.com/review/suggested-edits*
// @match        *://*.superuser.com/review/suggested-edits*
// @match        *://*.mathoverflow.net/review/suggested-edits*
//
// @exclude      /^https?:\/\/.*((askubuntu|serverfault|stackapps|stackexchange|stackoverflow|superuser)\.com|mathoverflow\.net)\/review\/.*\/(stats|history)/
//
// ==/UserScript==
/* globals $, StackExchange */

(function () {
    'use strict';

    const config = {
        postTypeMapping: {
            1: 'Question',
            2: 'Answer',
            4: 'Tag Wiki Excerpt',
            5: 'Tag Wiki'
        }
    };


    function modifyOuterContainerCSS() {
        $('.container')
            .css('min-width', '100%')
            .css('max-width', 'unset');
    }

    function modifyInnerContainerCSS() {
        $('#content')
            .css('margin', '0 auto')
            .css('width', '100%')
            .css('max-width', '1500px')
            .css('padding', '5px 25px');
    }

    function addPostTypeNotice(postTypeId) {
        if (postTypeId === undefined || !Object.hasOwn(config.postTypeMapping, postTypeId)) {
            return;
        }
        $('#panel-revision')
            .before($(`<div class="fs-headline2 ta-center fc-red-800">${config.postTypeMapping[postTypeId]}</div>`));
    }


    function addOnTaskChangeHandler() {
        $(document).on('ajaxComplete', (_0, {responseJSON}, {url}) => {
            if (url.startsWith('/review/next-task') || url.startsWith('/review/task-reviewed/')) {
                addPostTypeNotice(responseJSON?.postTypeId);
            }
        });
    }


    function main() {
        modifyOuterContainerCSS();
        modifyInnerContainerCSS();
        addOnTaskChangeHandler();
    }

    StackExchange.ready(main);
})();