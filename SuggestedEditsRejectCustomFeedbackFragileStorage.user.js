// ==UserScript==
// @name         Suggested Edit Custom Reject Feedback Saver
// @description  Adds very fragile storage so that the reject modal can be closed without losing in-progress feedback
// @homepage     https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.0.3
// @downloadURL  https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/SuggestedEditsRejectCustomFeedbackFragileStorage.user.js
// @updateURL    https://github.com/HenryEcker-SO-UserScripts/SO-UserScripts/raw/main/SuggestedEditsRejectCustomFeedbackFragileStorage.user.js
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
/* globals $ */

(function () {
    'use strict';

    const config = {
        attr: {
            textarea: 'sercffs-listening'
        }
    };

    let feedback = '';

    const handleInput = (ev) => {
        feedback = $(ev.target).val(); // save value in variable
    };

    // On open "This edit causes harm" textarea
    $(document).on('s-expandable-control:show', (ev) => {
        const t = $(ev.target);
        if (t.is('#rejection-reason-0')) {
            // Find textarea in controller
            const ta = $(`#${t.attr('aria-controls')} textarea`);

            // Attach listener to textarea (if not already present)
            if (ta.attr(config.attr.textarea) === undefined) {
                ta.on('input', handleInput);
                ta.attr(config.attr.textarea, 'true');
            }

            // Populate any existing feedback when present
            if (feedback !== '') {
                ta.val(feedback);
                ta.trigger('input');
                ta.trigger('propertychange');
                ta.focus();
            }
        }
    });

    $(document).on('ajaxComplete', (_0, _1, {url}) => {
        if (url.startsWith('/review/next-task') || url.startsWith('/review/task-reviewed/')) {
            // Clear feedback on each review navigation
            feedback = '';
        }
    });
})();