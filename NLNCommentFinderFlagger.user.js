// ==UserScript==
// @name         NLN Comment Finder/Flagger
// @description  Find comments which may potentially be no longer needed and flag them for removal
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.5.5
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/NLNCommentFinderFlagger.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/NLNCommentFinderFlagger.user.js
//
// @include      *://stackoverflow.com/users/flag-summary/15497888?group=4*
//
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-end
//
// ==/UserScript==
/* globals $, StackExchange, GM_config */


/* Functions that make external requests */
const getComments = (AUTH_STR, COMMENT_FILTER, FROM_DATE) => {
    return fetch(`https://api.stackexchange.com/2.3/comments?fromdate=${FROM_DATE}&pagesize=100&order=desc&sort=creation&filter=${COMMENT_FILTER}&${AUTH_STR}`).then(res => res.json())
};

const checkFlagOptions = (AUTH_STR, commentID) => {
    return fetch(`https://api.stackexchange.com/2.3/comments/${commentID}/flags/options?${AUTH_STR}`).then(res => res.json())
};

const getFlagQuota = (commentID) => {
    return new Promise((resolve, reject) => {
        $.get(`https://${location.hostname}/flags/comments/${commentID}/popup`)
            .done(function (data) {
                const pattern = /you have (\d+) flags left today/i;
                const flagsRemaining = Number($('div:contains("flags left today")', data).filter((idx, n) => n.childElementCount === 0 && n.innerText.match(pattern)).last().text().match(pattern)[1]);
                resolve(flagsRemaining);
            })
            .fail(reject);
    });
}

const flagComment = (fkey, commentID) => {
    const fd = new FormData();
    fd.set('fkey', fkey);
    fd.set('otherText', "");
    fd.set('overrideWarning', true);
    return fetch(`https://stackoverflow.com/flags/comments/${commentID}/add/39`, {
        method: "POST",
        body: new URLSearchParams(fd)
    })
};

/* General Utility Functions */
const calcNoiseRatio = (matches, body) => {
    let lengthWeight = matches.reduce((total, match) => {
        return total + match.length
    }, 0);
    return lengthWeight / body.length * 100;
}

const mergeRegexes = (arrRegex, flags) => {
    return new RegExp(arrRegex.map(p => p.source).join('|'), flags);
}

String.prototype.htmlDecode = function () {
    return new DOMParser().parseFromString(this, "text/html").documentElement.textContent;
}


/* Configurable Options */
GM_config.init({
    'id': 'NLN_Comment_Config',
    'title': 'NLN Comment Finder/FLagger Settings',
    'fields': {
        'SITE_NAME': {
            'label': 'Site Name',
            'section': ['API Information'],
            'type': 'text',
            'default': 'stackoverflow'
        },
        'ACCESS_TOKEN': {
            'label': 'Access Token',
            'type': 'text'
        },
        'KEY': {
            'label': 'Key',
            'type': 'text'
        },
        'API_QUOTA_LIMIT': {
            'label': 'At what API quota should this script stop making new requests',
            'type': 'int',
            'default': 500
        },
        'DELAY_BETWEEN_API_CALLS': {
            'label': 'How frequently (in seconds) should comments be fetched',
            'type': 'unsigned float',
            'min': 60, // Calls shouldn't be made more than once a minute
            'default': 180
        },
        'ACTIVE': {
            'label': 'Running',
            'section': ['Run Information'],
            'type': 'checkbox',
            'default': false
        },
        'RUN_IMMEDIATELY': {
            'label': 'Should run immediately on entering matched pages',
            'type': 'checkbox',
            'default': false
        },
        'AUTO_FLAG': {
            'label': 'Should Autoflag',
            'type': 'checkbox',
            'default': false
        },
        'POST_TYPE': {
            'label': 'Types of post to consider',
            'type': 'select',
            'options': ['all', 'question', 'answer'],
            'default': 'all'
        },
        'MAXIMUM_LENGTH_COMMENT': {
            'label': 'Maximum length comments to consider',
            'type': 'int',
            'min': 15, // Minimum comment length
            'max': 600, // Maximum length limit
            'default': 600 // Default to max
        },
        'CERTAINTY': {
            'label': 'How Certain should the script be to autoflag (out of 100)',
            'type': 'unsigned float',
            'min': 25,
            'max': 100,
            'default': 75
        },
        'FLAG_QUOTA_LIMIT': {
            'label': 'Stop flagging with how many remaining comment flags',
            'type': 'int',
            'min': 0,
            'max': 100,
            'default': 0
        }
    }
});

(function () {
    'use strict';

    const SITE_NAME = GM_config.get('SITE_NAME');
    const ACCESS_TOKEN = GM_config.get('ACCESS_TOKEN');
    const KEY = GM_config.get('KEY');
    if (!SITE_NAME || !ACCESS_TOKEN || !KEY) {
        // Will not run without a valid API auth string
        GM_config.open();
    }
    const AUTH_STR = `site=${SITE_NAME}&access_token=${ACCESS_TOKEN}&key=${KEY}`;
    const COMMENT_FILTER = '!SVaJvZISgqg34qVVD)';
    const FLAG_RATE = 7 * 1000;
    const API_REQUEST_RATE = () => GM_config.get('DELAY_BETWEEN_API_CALLS') * 1000; // Function call to allow changing delay without needing to reload the page

    // Add Config Button
    const settingsButton = $('<span title="NLN Comment Finder/Flagger Settings" style="font-size:15pt;cursor: pointer;" class="-link">⚙</span>');
    settingsButton.on('click', () => GM_config.open());
    const li = $('<li class="-item"></li>')
    li.append(settingsButton);
    $('header ol.user-logged-in > li:nth-child(3)').before(li);
    const fkey = StackExchange.options.user.fkey;

    const blacklist = mergeRegexes([
        // Smileys
        /\b(?::(?:\-(?:\)\)|\*|\]|\}|3|>)|‑(?:\)|,|D|P|b|p|Þ|þ)|'(?:‑\)|\))|\^\)|c\)|o\)|"D|\)|\*|\]|\}|3|>|D|P|b|p|×|Þ|þ)|;(?:‑(?:\)|\])|\^\)|\)|\]|3|>|D)|8(?:\-\)|\)|‑D|D)|=(?:\)|\]|3|D|p)|X(?:‑[DP]|3|D|P)|x(?:‑[Dp]|3|D|p)|\*(?:\-\)|\))|>:[3P]|B\^D|C:|c:|d:)\b/,
        // Text-speak
        /\b(?:t(?:y(?:sm|vm)?|hx)|ily(?:sm)?|k)\b/,
        // Glad to help
        /(?:happy\s+to\s+he(?:ar|lp)|glad\s+to\s+he(?:ar|lp))/,
        // You're/that's awesome!
        /(you('re|\s+are)?|that'?s)\s+(?:a(?:\s+rock\s+star|mazing|wesome)|incredible|brilliant|wonderful|rock)[.!]?/,
        // Any help would be appreciated
        /(Any\s+help\s+would\s+be\s+(?:a(?:ppreciated|wesome)|wonderful|great))/,
        // Exactly what I was looking for
        /(?:That's\s+(?:exactly\s+what\s+I\s+was\s+looking\s+for|what\s+I\s+was\s+looking\s+for!)|exactly\s+what\s+I\s+was\s+looking\s+for(?:,\s+thank\s+you!)?|You\s+found\s+it!|that\'s\s+it)/,
        // Happy coding
        /happy\s*coding/,
        /*
         * Following rules modified from https://github.com/kamil-tekiela/commentBot/blob/master/src/Comment.php
         */
        // gratitude
        /(?:(?:big\s+|many\s+)?th?ank(?:s|\s*you|\s*u)?(?:\s+a lot|\s+(?:very|so) much|\s+a mil+ion|\s+)?(?:\s*for (?:your|the)?(?:\s+help)?)?|th?anx|thx|cheers)[!\.,:()\s]*(?:\w+[!\.,:()\s]*)?/,
        // it worked like a charm
        /(?:this\s+|that\s+|it\s+)?(?:solution\s+)?work(?:ed|s)?\s*(?:now|perfectly|great|for me|like a charm)?[!\.:()\s]*/,
        // you are welcome
        /(?:(?:you(?:'?re?| are)\s+)?welcome)+[!.:()\s]*/,
        // this was very helpful
        /(?:(?:I\s+)?(?:hope\s+)?(?:your\s+|(?:this\s+|that\s+|it\s+)(?:was\s+|is\s+)?)?(?:very\s+)?help(?:ful|ed|s)|useful(?:\s+a lot|\s+(?:very|so) much)?)+[!\.:()\s]*/,
        // excitement
        /(?:wonderful|brilliant|Excellent|Marvelous|awesome|(?:You )?saved my\s+\w+)+[!\.:()\s]*/,
        // life saver
        /(?:You(?:'re|\s*are) )?a life saver[!.:()d=\s]*/,
        // please accept
        /(?:please(?: \w+)* )?accept(?:ed|ing)?\b(?: the answer)?/,
        // please upvote
        /(?:please(?: \w+) )?(?:give an? )?upvot(?:ed?|ing)(?: the answer)?/,
    ], 'gi');

    const whitelist = mergeRegexes([
        /(?:n(?:eed|ot)|unfortunate|persists|require|but)/,
        /(?:c(?:ouldn(?:'t?|’t?|t)?|an(?:'t?|’t?|t)?)|d(?:oesn(?:'t?|’t?|t)?|idn(?:'t?|’t?|t)?)|shouldn(?:'t?|’t?|t)?|wouldn(?:'t?|’t?|t)?|haven(?:'t?|’t?|t)?|isn(?:'t?|’t?|t)?)/,
        /[?]/
    ], 'gi');

    const postTypeFilter = (actualPT) => {
        const configPT = GM_config.get('POST_TYPE');
        if (configPT === 'all') {
            return true;
        } else {
            return configPT === actualPT;
        }
    }

    // Prime last successful read
    let lastSuccessfulRead = Math.floor(new Date(new Date() - API_REQUEST_RATE()) / 1000);

    const main = async (mainInterval) => {
        let response = await getComments(AUTH_STR, COMMENT_FILTER, lastSuccessfulRead);
        if (response.quota_remaining <= GM_config.get('API_QUOTA_LIMIT')) {
            clearInterval(mainInterval);
            return; // Exit script because checkFlagOptions could potentially make more API Calls
        }
        if (response.hasOwnProperty('items') && response.items.length > 0) {

            // Update last successful read time
            lastSuccessfulRead = Math.floor(new Date() / 1000) + 1;

            response.items
                .filter(comment => postTypeFilter(comment.post_type) && comment.body_markdown.length <= GM_config.get('MAXIMUM_LENGTH_COMMENT')) // Easy excludes before doing regex
                .map(comment => {
                    let decodedMarkdown = comment.body_markdown.htmlDecode();
                    return {
                        can_flag: comment.can_flag,
                        body: decodedMarkdown,
                        link: comment.link,
                        _id: comment.comment_id,
                        post_id: comment.post_id,
                        post_type: comment.post_type,
                        blacklist_matches: decodedMarkdown.match(blacklist)
                    }
                })
                .filter(comment => {
                    if (comment.blacklist_matches && !comment.body.match(whitelist)) {
                        let noiseRatio = calcNoiseRatio(comment.blacklist_matches, comment.body);
                        console.log(comment.blacklist_matches, noiseRatio, comment.link);

                        return noiseRatio > GM_config.get('CERTAINTY');
                    }
                })
                .forEach((comment, idx) => {
                    if (GM_config.get('AUTO_FLAG')) {
                        setTimeout(() => {
                            // "Open" comment flagging dialog to get remaining Flag Count
                            getFlagQuota(comment._id).then(remainingFlags => {
                                if (remainingFlags <= GM_config.get('FLAG_QUOTA_LIMIT')) {
                                    console.log("Out of flags. Stopping script");
                                    clearInterval(mainInterval);
                                    return; // Exit so nothing tries to be flagged
                                }
                                checkFlagOptions(AUTH_STR, comment._id).then((flagOptions) => {
                                    if (
                                        flagOptions.hasOwnProperty('items') &&
                                        !flagOptions.items.some(e => e.has_flagged) // Ensure not already flagged in some way
                                    ) {
                                        // Flag post
                                        console.log("Would've autoflagged", comment._id, "(", comment.link, ")");
                                        // flagComment(fkey, elem.comment_id); // Autoflagging
                                    }
                                });

                            });
                        }, idx * FLAG_RATE);
                    }
                });
        }
    };
    if (GM_config.get('ACTIVE')) {
        if (GM_config.get('RUN_IMMEDIATELY')) {
            main(undefined);
        }
        let mainInterval = setInterval(() => main(mainInterval), API_REQUEST_RATE());
    }
})();
