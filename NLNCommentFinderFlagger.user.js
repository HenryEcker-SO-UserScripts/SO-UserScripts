// ==UserScript==
// @name         NLN Comment Finder/Flagger
// @description  Find comments which may potentially be no longer needed and flag them for removal
// @homepage     https://github.com/HenryEcker/SO-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      1.7.9
// @downloadURL  https://github.com/HenryEcker/SO-UserScripts/raw/main/NLNCommentFinderFlagger.user.js
// @updateURL    https://github.com/HenryEcker/SO-UserScripts/raw/main/NLNCommentFinderFlagger.user.js
//
// @include      *://stackoverflow.com/users/flag-summary/15497888?group=4*
//
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @require      https://raw.githubusercontent.com/HenryEcker/SO-UserScripts/main/so_userscript_utils.js
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-end
//
// ==/UserScript==
/* globals $, StackExchange, GM_config, getURLSearchParamsFromObject, getFormDataFromObject */


/* General Utility Functions */
/**
 * Converts an array of distinct RegExp and joins them together using OR (|)
 *
 * @param {[RegExp]} arrRegex Array of RegExp that will be ORed (|) together
 * @param {string} flags String representation of flags to apply to the joined RegExp (e.g. 'g', 'i', 'gi', etc.)
 * @returns {RegExp} The joint RegExp
 */
const mergeRegexes = (arrRegex, flags) => {
    return new RegExp(arrRegex.map(p => p.source).join('|'), flags);
}
/**
 * Adds an htmlDecode function to all Strings. This makes it easy to decode the response from the SE API
 * @returns {string}
 */
String.prototype.htmlDecode = function () {
    return new DOMParser().parseFromString(this, "text/html").documentElement.textContent;
}

/**
 * Formats a number to two decimal places with a percent sign
 *
 * @param {number} percent The value to format
 * @param {number} precision The number of decimal places to round to. (Defaults to 2)
 * @returns {`${string}%`} The rounded percent with % sign
 */
const formatPercentage = (percent, precision = 2) => {
    return `${percent.toFixed(precision)}%`;
}

/* Script Specific Utility Functions */
/**
 * Calculate what percentage of the comment is noise
 *
 * @param {[string]} matches Result from String.match
 * @param {number} totalLength Total Length of the String
 * @returns {number} The resulting noise percentage (out of 100)
 */
const calcNoiseRatio = (matches, totalLength) => {
    let lengthWeight = matches.reduce((total, match) => {
        return total + match.length
    }, 0);
    return lengthWeight / totalLength * 100;
}

/**
 * Get timestamp for now offset by a certain number of hours prior.
 * hours=0 will just return the timestamp for now.
 *
 * @param {number} hours Number of hours to offset
 * @returns {number} The timestamp relative to now
 */
const getOffset = (hours) => {
    return new Date() - (hours * 60 * 60 * 1000)
}

/**
 * Easily format comment as a String. Includes noise ratio, blacklist matches, and link to comment
 *
 * @param {object} comment
 * @returns {`${string}% [${*}] (${*})`}
 */
const formatComment = (comment) => {
    return `${formatPercentage(comment.noise_ratio)} [${comment.blacklist_matches.join(',')}] (${comment.link})`;
}

/**
 * Easily output error messages and the comment they occurred on.
 * @param {Error} err
 * @param {object} comment
 */
const displayErr = (err, comment) => {
    console.error(err);
    console.error("Would've autoflagged", formatComment(comment));
}


/* Functions that make external requests */
/**
 * Get comments to analyse.
 *
 * @param {string} AUTH_STR Complete Auth String needed to make API requests including site, access_token, and key
 * @param {string} COMMENT_FILTER API Filter to specify the returned fields
 * @param {number} FROM_DATE Beginning of comment window (SE API Timestamp is in seconds not milliseconds)
 * @param {number} TO_DATE End of comment window (SE API Timestamp is in seconds not milliseconds)
 * @returns {Promise<JSON>} Fetch returns a JSON response
 */
const getComments = (AUTH_STR, COMMENT_FILTER, FROM_DATE, TO_DATE = undefined) => {
    let usp = getURLSearchParamsFromObject({
        'pagesize': 100,
        'order': 'desc',
        'sort': 'creation',
        'filter': COMMENT_FILTER,
        'fromdate': FROM_DATE,
        ...(TO_DATE && {'todate': TO_DATE})
    });
    return fetch(`https://api.stackexchange.com/2.3/comments?${usp.toString()}&${AUTH_STR}`).then(res => res.json());
};


/**
 * Base Class of Errors which share the name with their class name
 */
class SelfNamedError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

/**
 * Errors used to differentiate the various failure modes
 */
class FlagAttemptFailed extends SelfNamedError {
}

class RatedLimitedError extends SelfNamedError {
}

class OutOfFlagsError extends SelfNamedError {
}

/**
 * Fetches the number of flags remaining by "opening" the flag dialogue popup and scraping the HTML
 *
 * @param {number} commentID Any visible comment will work (it just needs a comment to be able to open the flagging dialogue)
 * @returns {Promise<number>} The number of remaining flags
 *
 * @throws {RatedLimitedError} Throws a RateLimitedError when attempting to open the popup too quickly. The popup can only be opened once every 3 seconds (globally)
 */
const getFlagQuota = (commentID) => {
    return new Promise((resolve, reject) => {
        $.get(`https://${location.hostname}/flags/comments/${commentID}/popup`)
            .done(function (data) {
                const pattern = /you have (\d+) flags left today/i;
                const flagsRemaining = Number($('div:contains("flags left today")', data).filter((idx, n) => n.childElementCount === 0 && n.innerText.match(pattern)).last().text().match(pattern)[1]);
                resolve(flagsRemaining);
            })
            .fail(err => {
                if (err.status === 409) {
                    throw new RatedLimitedError("You may only load the comment flag dialog every 3 seconds");
                } else {
                    return reject();
                }
            });
    });
}
/**
 * Flag the comment using an HTML POST to the route. The NLN flag type is hard coded (39).
 *
 * @param {string} fkey Needed to identify the user
 * @param {number} commentID The id of the comment to flag
 * @returns {Promise<boolean>} Resolves true if the flag was successful, and the comment was deleted upon flagging. Resolves false if the flag was successful, but the comment is not yet deleted.
 *
 * @throws {RatedLimitedError} Throws a RateLimitedError when attempting to flag too quickly. The flags can only be added every 5 seconds (globally)
 * @throws {OutOfFlagsError} Throws an OutOfFlagsError if there are no more available flags for the day.
 * @throws {FlagAttemptFailed} Throws a FlagAttemptFailed if the flag attempt failed for some other reason.
 */
const flagComment = (fkey, commentID) => {
    return fetch(`https://${location.hostname}/flags/comments/${commentID}/add/39`, {
        method: "POST",
        body: getFormDataFromObject({
            'fkey': fkey,
            'otherText': "",
            'overrideWarning': true
        })
    }).then(res => {
        if (res.status === 409) {
            throw new RatedLimitedError("You can only flag once every 5 seconds");
        } else if (res.status === 200) {
            return res.json();
        }
    }).then(resData => {
        if (resData.Success && resData.Outcome === 0) {
            return Promise.resolve(resData.ResultChangedState);
        } else if (!resData.Success && resData.Outcome === 2) {
            if (resData.Message === "You have already flagged this comment") {
                return Promise.resolve(false);
            } else if (resData.Message === "This comment is deleted and cannot be flagged") {
                return Promise.resolve(true);
            } else if (resData.Message.toLowerCase().includes('out of flag')) {
                throw new OutOfFlagsError(resData.Message);
            } else {
                throw new FlagAttemptFailed(resData.Message);
            }
        }
    });
};

/* Configurable Options */
GM_config.init({
    'id': 'NLN_Comment_Config',
    'title': 'NLN Comment Finder/Flagger Settings',
    'fields': {
        'SITE_NAME': {
            'label': 'Site Name',
            'section': ['API Information (Changes will take affect on page refresh)'],
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
        'HOUR_OFFSET': {
            'label': 'How long ago (in hours) should the calls be offset',
            'type': 'unsigned float',
            'min': 0,
            'default': 0
        },
        'DISPLAY_CERTAINTY': {
            'label': 'How certain should the script be to display in UI (out of 100)',
            'type': 'unsigned float',
            'min': 0,
            'max': 100,
            'default': 25
        },
        'AUTOFLAG_CERTAINTY': {
            'label': 'How certain should the script be to autoflag if checked (out of 100)',
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
        },
        'DOCUMENT_TITLE_SHOULD_UPDATE': {
            'label': 'Update Title with number of pending comments for review: ',
            'section': ['UI Config (Changes will take affect on page refresh)'],
            'type': 'checkbox',
            'default': true
        },
        'UI_DISPLAY_LINK_TO_COMMENT': {
            'label': 'Display Link to Comment: ',
            'type': 'checkbox',
            'default': true
        },
        'UI_DISPLAY_BLACKLIST_MATCHES': {
            'label': 'Display Blacklist Matches: ',
            'type': 'checkbox',
            'default': true
        },
        'UI_DISPLAY_NOISE_RATIO': {
            'label': 'Display Noise Ratio: ',
            'type': 'checkbox',
            'default': true
        },
        'UI_DISPLAY_FLAG_BUTTON': {
            'label': 'Display Flag button: ',
            'type': 'checkbox',
            'default': true
        },
        'UI_DISPLAY_COMMENT_DELETE_STATE': {
            'label': 'Display If comment was deleted or not: ',
            'type': 'checkbox',
            'default': true
        },
    }
});

class NLNUI {
    constructor(mountPoint, fkey, uiConfig) {
        this.mountPoint = mountPoint;
        this.fkey = fkey;
        this.uiConfig = uiConfig;
        this.htmlIds = {
            containerDivId: "NLN_Comment_Wrapper",
            tableId: "NLN_Comment_Reports_Table",
            tableBodyId: "NLN_Comment_Reports_Table_Body"
        };
        this.SOClasses = {
            tableContainerDiv: 's-table-container',
            table: 's-table',
            buttonPrimary: 's-btn s-btn__primary',
            buttonGeneral: 's-btn',
            pendingSpan: '<span class="supernovabg mod-flag-indicator">pending</span>'
        }
        this.tableData = {};
        this.buildBaseStyles();
        this.buildBaseUI();
    }

    buildBaseStyles() {
        // Add Styles
        const styles = document.createElement('style');
        styles.innerHTML = `
#${this.htmlIds.containerDivId} {
    padding: 25px 0;
}
`;
        document.body.appendChild(styles);
    }

    buildBaseUI() {
        const container = $(`<div id="${this.htmlIds.containerDivId}""></div>`);
        // Header Elements
        {
            container.append($(`<h2>NLN Comments</h2>`))
        }
        // Build Table
        {
            const tableContainer = $(`<div class="${this.SOClasses.tableContainerDiv}"></div>`);
            const table = $(`<table id="${this.htmlIds.tableId}" class="${this.SOClasses.table}"></table>`);
            const thead = $('<thead></thead>')
            const tr = $('<tr></tr>')
            tr.append($('<th>Comment Text</th>'));
            if (this.uiConfig.displayLink) {
                tr.append($('<th>Link</th>'));
            }
            if (this.uiConfig.displayBlacklistMatches) {
                tr.append($('<th>Blacklist Matches</th>'));
            }
            if (this.uiConfig.displayNoiseRatio) {
                tr.append($('<th>Noise Ratio</th>'));
            }
            if (this.uiConfig.displayFlagUI) {
                tr.append($('<th>Flag</th>'));
            }
            if (this.uiConfig.displayCommentDeleteState) {
                tr.append($('<th>Deleted</th>'));
            }
            tr.append($('<th>Clear</th>'));
            thead.append(tr);
            table.append(thead);
            table.append($(`<tbody id="${this.htmlIds.tableBodyId}"></tbody>`));
            tableContainer.append(table);
            container.append(tableContainer);
        }
        // After
        {
            const clearAllButton = $(`<button class="${this.SOClasses.buttonPrimary}">Clear All</button>`);
            clearAllButton.on('click', () => {
                this.tableData = {};
                this.render();
            })
            container.append(clearAllButton);
        }
        this.mountPoint.before(container);
    }

    render() {
        const tbody = $(`#${this.htmlIds.tableBodyId}`);
        tbody.empty();
        Object.values(this.tableData).forEach(comment => {
            const tr = $('<tr></tr>');
            tr.append(`<td>${comment.body}</td>`);

            if (this.uiConfig.displayLink) {
                tr.append(`<td><a href="${comment.link}" target="_blank">${comment._id}</a></td>`);
            }
            if (this.uiConfig.displayBlacklistMatches) {
                tr.append(`<td>${comment.blacklist_matches.map(e => `"${e}"`).join(', ')}</td>`);
            }
            if (this.uiConfig.displayNoiseRatio) {
                tr.append(`<td>${formatPercentage(comment.noise_ratio)}</td>`);
            }

            if (this.uiConfig.displayFlagUI) {
                // Flag Button/Indicators
                if (!comment.can_flag) {
                    tr.append(`<td>🚫</td>`);
                } else if (comment.was_flagged) {
                    tr.append(`<td>✓</td>`);
                } else {
                    const flagButton = $(`<button data-comment-id="${comment._id}" class="${this.SOClasses.buttonPrimary}">Flag</button>`);
                    flagButton.on('click', () => {
                        flagButton.text('Flagging...');
                        this.handleFlagComment(this.fkey, comment._id)
                    });
                    const td = $('<td></td>');
                    td.append(flagButton);
                    tr.append(td);
                }
            }

            if (this.uiConfig.displayCommentDeleteState) {
                if (comment.hasOwnProperty('was_deleted')) {
                    if (comment.was_deleted) {
                        tr.append(`<td>✓</td>`);
                    } else {
                        tr.append(`<td>${this.SOClasses.pendingSpan}</td>`);
                    }
                } else {
                    tr.append(`<td></td>`);
                }
            }
            // Clear Button
            {
                const clearButton = $(`<button class="${this.SOClasses.buttonGeneral}">Clear</button>`);
                clearButton.on('click', () => this.removeComment(comment._id));
                const clearButtonTD = $('<td></td>');
                clearButtonTD.append(clearButton);
                tr.append(clearButtonTD);
            }
            tbody.prepend(tr);
        });
        this.updatePageTitle();
    }

    handleFlagComment(fkey, comment_id) {
        flagComment(this.fkey, comment_id).then((res) => {
            this.tableData[comment_id].was_flagged = true;
            this.tableData[comment_id].was_deleted = res;
        }).catch((err) => {
            if (err instanceof RatedLimitedError) {
                alert('Flagging too fast!');
            } else if (err instanceof OutOfFlagsError) {
                alert(err.message);
                this.tableData[comment_id].can_flag = false;
            } else if (err instanceof FlagAttemptFailed) {
                alert(err.message);
                this.tableData[comment_id].can_flag = false;
            }
        }).finally(() => {
            this.render();
        });
    }

    addComment(comment, was_flagged = false) {
        this.tableData[comment._id] = {
            ...comment,
            was_flagged: was_flagged
        };
        this.render();
    }

    removeComment(comment_id) {
        delete this.tableData[comment_id];
        this.render();
    }

    updatePageTitle() {
        if (this.uiConfig.shouldUpdateTitle) {
            let pending = Object.values(this.tableData).reduce((acc, comment) => {
                if (comment.can_flag && !comment.was_flagged) {
                    return acc + 1;
                } else {
                    return acc;
                }
            }, 0);


            let title = document.title.replace(/^\(\d+\)\s+/, '');
            if (pending > 0) {
                title = `(${pending}) ${title}`;
            }
            document.title = title;
        }
    }
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
    const COMMENT_FILTER = '!SVaJvZISgqg34qVVD)';
    const FLAG_RATE = 7 * 1000;
    const API_REQUEST_RATE = GM_config.get('DELAY_BETWEEN_API_CALLS') * 1000;

    // Add Config Button
    const settingsButton = $('<span title="NLN Comment Finder/Flagger Settings" style="font-size:15pt;cursor: pointer;" class="s-topbar--item">⚙</span>');
    settingsButton.on('click', () => GM_config.open());
    const li = $('<li></li>')
    li.append(settingsButton);
    $('header ol.s-topbar--content > li:nth-child(2)').after(li);
    const fkey = StackExchange.options.user.fkey;

    const blacklist = mergeRegexes([
        // Emojis
        /(?:[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/,
        // Ascii Smileys/Punctuation spam
        /\s+((?=[!-~])[\W_]){2,}\s*/,
        // Text-speak
        /\b(?:t(?:y(?:sm|vm)?|hx)|ily(?:sm)?|k)\b/,
        // Glad to help/Happy I could help/Glad to hear
        /(?:happy|glad)\s*(?:\w+\s+)*?(he(?:ar|lp))/,
        // You're/that's awesome!
        /(?:you(r|['’]?re|\s+are)?|that['’]?s?)\s+(?:a(?:\s+rock\s+star|mazing|wesome)|incredible|brilliant|wonderful|rock|perfect)[.!]?/,
        // Any help would be appreciated
        /(?:Any\s+help\s+would\s+be\s+(?:a(?:ppreciated|wesome)|wonderful|great))/,
        // That's what I was looking for/that's it
        /((?:\w+\s+)*?(?:looking\s*for)|that['’]?s?\s*it)[.!]?/,
        // Happy coding
        /(?:happy\s+coding)/,
        // TRE('bro', 'dude', 'man', 'bud', 'buddy', 'amigo', 'pal', 'homie', 'friend', 'mate', 'sir', 'fam')
        /\b(?:b(?:ud(?:dy)?|ro)|f(?:riend|am)|ma(?:te|n)|amigo|homie|dude|pal|sir)\b/,
        /*
         * Following rules modified from https://github.com/kamil-tekiela/commentBot/blob/master/src/Comment.php
         */
        // gratitude
        /(?:(?:big\s+|many\s+)?th?ank(?:s|\s*you|\s*u)?(?:\s+a lot|\s+(?:very|so) much|\s+a mil+ion|\s+)?(?:\s*for (?:your|the)?(?:\s+help)?)?|th?anx|thx|cheers)/,
        // it worked like a charm
        /(?:this\s+|that\s+|it\s+)?(?:solution\s+)?work(?:ed|s)?\s*(?:now|perfectly|great|for me|like a charm)?/,
        // you are welcome
        /(?:(?:you(?:'?re?|\s+are)\s+)?welcome)+/,
        // this was very helpful
        /(?:(?:I\s+)?(?:hope\s+)?(?:your\s+|(?:this\s+|that\s+|it\s+)(?:was\s+|is\s+)?)?(?:very\s+)?help(?:ful|ed|s)|useful(?:\s+a lot|\s+(?:very|so) much)?)+/,
        // excitement
        /(?:perfect|wonderful|brilliant|Excellent|Marvelous|awesome|(?:You\s+)?saved\s+m[ey])/,
        // life saver
        /(?:You(?:'re|\s*are)\s+)?a\s+life\s+saver/,
        // please accept
        /(?:please(?:\s+\w+)*\s+)?accept(?:ed|ing)?\b(?:\s+the\s+answer)?/,
        // please upvote
        /(?:please(?:\s+\w+)\s+)?(?:give an?\s+)?upvot(?:ed?|ing)(?:\s+the answer)?/,
    ], 'gi');

    const whitelist = mergeRegexes([
        /\b(?:n(?:eed|ot)|unfortunate(ly)?|persists?|require|but|unaccept(ed)?)\b/,
        /*
        bases = ["would", "could", "should",
                 "do", "did", "does",
                 "have", "has",
                 "ca", "ai",
                 "are", "is"]
         suffixes = ["n't", "n’t", "n'", "n’", "nt"]
         */
        /(?:d(?:o(?:esn(?:'t?|’t?|t)|n(?:'t?|’t?|t))|idn(?:'t?|’t?|t))|c(?:ouldn(?:'t?|’t?|t)|an(?:'t?|’t?|t))|ha(?:ven(?:'t?|’t?|t)|sn(?:'t?|’t?|t))|a(?:ren(?:'t?|’t?|t)|in(?:'t?|’t?|t))|shouldn(?:'t?|’t?|t)|wouldn(?:'t?|’t?|t)|isn(?:'t?|’t?|t))/,
        /\b(will|I'?ll)\s*try\b/,
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
    let lastSuccessfulRead = Math.floor((getOffset(GM_config.get('HOUR_OFFSET')) - API_REQUEST_RATE) / 1000);

    // Build UI
    let UI = new NLNUI($('#mainbar'), fkey, {
        displayLink: GM_config.get('UI_DISPLAY_LINK_TO_COMMENT'),
        displayNoiseRatio: GM_config.get('UI_DISPLAY_NOISE_RATIO'),
        displayFlagUI: GM_config.get('UI_DISPLAY_FLAG_BUTTON'),
        displayBlacklistMatches: GM_config.get('UI_DISPLAY_BLACKLIST_MATCHES'),
        displayCommentDeleteState: GM_config.get('UI_DISPLAY_COMMENT_DELETE_STATE'),
        shouldUpdateTitle: GM_config.get('DOCUMENT_TITLE_SHOULD_UPDATE'),
    });
    // Only Render if Active
    if (GM_config.get('ACTIVE')) {
        UI.render();
    }

    const disableAutoFlagging = () => {
        console.log("No more flags available for autoflagging. Disabling...");
        GM_config.set('AUTO_FLAG', false);
    }

    const main = async (mainInterval) => {
        let toDate = Math.floor(getOffset(GM_config.get('HOUR_OFFSET')) / 1000);
        let response = await getComments(
            AUTH_STR,
            COMMENT_FILTER,
            lastSuccessfulRead,
            toDate
        );
        if (response.quota_remaining <= GM_config.get('API_QUOTA_LIMIT')) {
            clearInterval(mainInterval);
            return; // Exit script because checkFlagOptions could potentially make more API Calls
        }
        if (response.hasOwnProperty('items') && response.items.length > 0) {

            // Update last successful read time
            lastSuccessfulRead = toDate + 1;

            response.items
                .reduce((acc, comment) => {
                    if (postTypeFilter(comment.post_type) && comment.body_markdown.length <= GM_config.get('MAXIMUM_LENGTH_COMMENT')) {
                        const decodedMarkdown = comment.body_markdown.htmlDecode();
                        const blacklistMatches = decodedMarkdown.replace(/`.*`/g, '').match(blacklist); // exclude code from analysis
                        if (blacklistMatches && !decodedMarkdown.match(whitelist)) {
                            const noiseRatio = calcNoiseRatio(
                                blacklistMatches,
                                decodedMarkdown.replace(/\B@\w+/g, '').length// Don't include at mentions in length of string
                            );
                            const newComment = {
                                can_flag: comment.can_flag,
                                body: decodedMarkdown,
                                link: comment.link,
                                _id: comment.comment_id,
                                post_id: comment.post_id,
                                post_type: comment.post_type,
                                blacklist_matches: blacklistMatches,
                                noise_ratio: noiseRatio
                            };
                            if (noiseRatio >= GM_config.get('AUTOFLAG_CERTAINTY')) {
                                acc.push(newComment);
                            } else if (noiseRatio >= GM_config.get('DISPLAY_CERTAINTY')) {
                                // Isn't an autoflag_candidate
                                UI.addComment(newComment, false);
                            }
                        }
                    }
                    return acc;
                }, [])
                .forEach((comment, idx) => {
                    if (GM_config.get('AUTO_FLAG')) {
                        setTimeout(() => {
                            // "Open" comment flagging dialog to get remaining Flag Count
                            getFlagQuota(comment._id).then(remainingFlags => {
                                if (remainingFlags <= GM_config.get('FLAG_QUOTA_LIMIT')) {
                                    disableAutoFlagging();
                                    return; // Exit so nothing tries to be flagged
                                }
                                // Autoflagging
                                flagComment(fkey, comment._id)
                                    .then((res) => {
                                        UI.addComment({...comment, was_deleted: res}, true);
                                    })
                                    .catch(err => {
                                        if (err instanceof RatedLimitedError) {
                                            displayErr(err, comment);
                                            UI.addComment(comment, false);
                                        } else if (err instanceof OutOfFlagsError) {
                                            displayErr(err, comment);
                                            UI.addComment(comment, false);
                                            disableAutoFlagging();
                                        } else if (err instanceof FlagAttemptFailed) {
                                            displayErr(err, comment);
                                            // Add to UI with can_flag false to render the 🚫
                                            UI.addComment({...comment, can_flag: false}, true);
                                        }
                                    });
                            }).catch(err => displayErr(err, comment));
                        }, idx * FLAG_RATE);
                    } else {
                        UI.addComment(comment, false);
                    }
                });
        }
    };
    if (GM_config.get('ACTIVE')) {
        if (GM_config.get('RUN_IMMEDIATELY')) {
            main(undefined);
        }
        let mainInterval = setInterval(() => main(mainInterval), API_REQUEST_RATE);
    }
})();
