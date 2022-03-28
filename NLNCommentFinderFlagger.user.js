// ==UserScript==
// @name         NLN Comment Finder/Flagger
// @description  Find comments which may potentially be no longer needed and flag them for removal
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.4.1
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


const getComments = (AUTH_STR, COMMENT_FILTER, FROM_DATE) => {
    return fetch(`https://api.stackexchange.com/2.3/comments?fromdate=${FROM_DATE}&pagesize=100&order=desc&sort=creation&filter=${COMMENT_FILTER}&${AUTH_STR}`).then(res => res.json())
};

const checkFlagOptions = (AUTH_STR, commentID) => {
    return fetch(`https://api.stackexchange.com/2.3/comments/${commentID}/flags/options?${AUTH_STR}`).then(res => res.json())
};

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

const countWords = (str) => {
    return str.trim().split(/\s+/).length;
}


const calcNoiseRatio = (matches, body) => {
    let countWeight = matches.reduce((total, match) => {
        return total + countWords(match)
    }, 0);
    let countNoiseRatio = countWeight / countWords(body) * 100;

    let lengthWeight = matches.reduce((total, match) => {
        return total + match.length
    }, 0);
    let lengthNoiseRatio = lengthWeight / body.length * 100;
    console.log("Count Ratio ", countNoiseRatio, " Length Ratio ", lengthNoiseRatio);
    return (countNoiseRatio + lengthNoiseRatio) / 2;
}

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
        'CERTAINTY': {
            'label': 'How Certain should the script be to autoflag (out of 100)',
            'type': 'unsigned float',
            'default': 75
        },
        'FLAG_QUOTA_LIMIT': {
            'label': 'Stop flagging with how many remaining comment flags',
            'type': 'int',
            'min': 0,
            'max': 99,
            'default': 0
        }
    }
});

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
    const COMMENT_FILTER = '!1zIEzUczZRkkJ4rMA(o8G';
    const FLAG_RATE = 10 * 1000;
    const API_REQUEST_RATE = () => GM_config.get('DELAY_BETWEEN_API_CALLS') * 1000;

    // Add Config Button
    const settingsButton = $('<span title="NLN Comment Finder/Flagger Settings" style="font-size:15pt;cursor: pointer;" class="-link">⚙</span>');
    settingsButton.on('click', () => GM_config.open());
    const li = $('<li class="-item"></li>')
    li.append(settingsButton);
    $('header ol.user-logged-in > li:nth-child(3)').before(li);
    const fkey = StackExchange.options.user.fkey;


    const blacklist = new RegExp([
        "((?:^)@(\\w+)\\b\\s)?thank([\\w.,!\']*)?(\\s[\\w{1,8},.@!:\\-)]*)?(\\s[\\w{1,8},.@!:\\-)]*)?(\\s[\\w{1,8},.@!:\\-)]*)?",
        "glad(?:\\sto\\shelp|hear)?",
        "(appreciate|perfect|awesome|amazing|excellent)(?:,|\w{1,2})?(\\s(?:solution|example)?)?",
        "solv(\\w{1,3})(\\s(\w{2,5}))\\s(\\w{1,9})?",
        "(\\w{1,8}\\s)?up(?:\\s)?vote\\s(\\w{0,8})?\\s(\\w{0,8})?",
        "(\\w{1,5}([\\w{,2}\']*)\\s)?work([\\w*{0,3}!.]*)?(\\s[:\\-)+=.}]*)?",
        "save(\\w{1,3})?\\s(\\w{0,4})\\s([\\w{0,6}.!:\\-)]*)?",
        "([\\w{1,8},.@!:)]*\\s)?(love|cheers|great)(\\s[\\w{1,8},.@!:)]*)?",
        ":\\)| :-\\)|;\\)",
        '(?:(?:big\s+|many\s+)?th?ank(?:s|\s*you|\s*u)?(?:\s+a lot|\s+(?:very|so) much|\s+a mil+ion|\s+)?(?:\s*for (?:your|the)?(?:\s+help)?)?|th?anx|thx|cheers)[!\.,:()\s]*(?:\w+[!\.,:()\s]*)?',
        '(?:this\s+|that\s+|it\s+)?(?:solution\s+)?work(?:ed|s)?\s*(?:now|perfectly|great|for me|like a charm)?[!\.:()\s]*',
        '(?:(?:you(?:\'?re?| are)\s+)?welcome)+[!\.:()\s]*',
        '(?:(?:I\s+)?(?:hope\s+)?(?:your\s+|(?:this\s+|that\s+|it\s+)(?:was\s+|is\s+)?)?(?:very\s+)?help(?:ful|ed|s)|useful(?:\s+a lot|\s+(?:very|so) much)?)+[!\.:()\s]*',
        '(?:I\s+)?(?:done|updated|edited|fixed)+\s*(?:my|the|a)?\s*(?:answer|question|it|that|this)?[!\.:()\s]*',
        '(?:wonderful|brilliant|Excellent|Marvelous|awesome|(?:You )?saved my\s+\w+)+[!\.:()\s]*',
        '(?:You(?:\'re|\s*are) )?a life saver[!\.:()d=\s]*',
        '(?:please(?: \w+)* )?accept(?:ed|ing)?\b(?: the answer)?',
        '(?:please(?: \w+) )?(?:give an? )?upvot(?:ed?|ing)(?: the answer)?',
    ].join("|"), 'gi');

    let whitelist = RegExp([
        "not|unfortunate|but|require|need|persists",
        "\\b(doesn|don|didn|couldn|can|isn)(['’])?(\\w{1,2})?\\b",
        "[?]"
    ].join("|"), 'gi');

    const main = async (mainInterval) => {
        console.log('Fetching...')
        let response = await getComments(
            AUTH_STR,
            COMMENT_FILTER,
            Math.floor(new Date(new Date() - API_REQUEST_RATE()) / 1000)
        );
        if (response.quota_remaining <= GM_config.get('API_QUOTA_LIMIT')) {
            clearInterval(mainInterval);
            return; // Exit script because checkFlagOptions could potentially make more API Calls
        }
        if (response.hasOwnProperty('items') && response.items.length > 0) {
            getFlagQuota(response.items[0].comment_id).then(remainingFlags => {
                if (remainingFlags <= GM_config.get('FLAG_QUOTA_LIMIT')) {
                    console.log("Out of flags. Stopping script");
                    clearInterval(mainInterval);
                    return; // Exit so nothing tries to be flagged from this batch
                }
                response.items
                    .filter(elem => elem.body.length < 85)
                    .map(a => ({
                        can_flag: a.can_flag,
                        body: a.body,
                        body_length: a.body.length,
                        link: a.link,
                        comment_id: a.comment_id,
                        post_id: a.post_id,
                        blacklist_matches: a.body.match(blacklist)
                    }))
                    .filter(elem => elem.blacklist_matches && !elem.body.match(whitelist))
                    .forEach((elem, idx) => {
                        let noiseRatio = calcNoiseRatio(elem.blacklist_matches, elem.body);
                        console.log(elem.blacklist_matches, noiseRatio, elem.link);
                        if (GM_config.get('AUTO_FLAG') && (noiseRatio > GM_config.get('CERTAINTY'))) {
                            checkFlagOptions(AUTH_STR, elem.comment_id).then((flagOptions) => {
                                if (
                                    flagOptions.hasOwnProperty('items') &&
                                    !flagOptions.items.some(e => e.has_flagged) && // Ensure not already flagged in some way
                                    remainingFlags > GM_config.get('FLAG_QUOTA_LIMIT') // Ensure has flags to do so
                                ) {
                                    remainingFlags -= 1; // Flag would have been used
                                    console.log("Would've autoflagged");
                                }
                            });
                        }
                    });
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
