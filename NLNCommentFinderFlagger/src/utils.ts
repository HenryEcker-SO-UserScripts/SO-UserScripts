import {Comment} from "./types";

/**
 * Converts an array of distinct RegExp and joins them together using OR (|)
 *
 * @param {[RegExp]} arrRegex Array of RegExp that will be ORed (|) together
 * @param {string} flags String representation of flags to apply to the joined RegExp (e.g. 'g', 'i', 'gi', etc.)
 * @returns {RegExp} The joint RegExp
 */
export function mergeRegexes(arrRegex: [RegExp], flags: string): RegExp {
    return new RegExp(arrRegex.map(p => p.source).join('|'), flags);
}

/**
 * Formats a number to two decimal places with a percent sign
 *
 * @param {number} percent The value to format
 * @param {number} precision The number of decimal places to round to. (Defaults to 2)
 * @returns {`${string}%`} The rounded percent with % sign
 */
export function formatPercentage(percent: number, precision: number = 2): string {
    return `${percent.toFixed(precision)}%`;
}

/**
 * Calculate what percentage of the comment is noise
 *
 * @param {[string]} matches Result from String.match
 * @param {number} totalLength Total Length of the String
 * @returns {number} The resulting noise percentage (out of 100)
 */
export function calcNoiseRatio(matches: [string], totalLength: number): number {
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
export function getOffset(hours: number): number {
    return new Date().getTime() - (hours * 60 * 60 * 1000)
}

/**
 * Easily format comment as a String. Includes noise ratio, blacklist matches, and link to comment
 *
 * @param {Comment} comment
 * @returns {`${string}% [${*}] (${*})`}
 */
export function formatComment(comment: Comment): string {
    return `${formatPercentage(comment.noise_ratio)} [${comment.blacklist_matches.join(',')}] (${comment.link})`;
}

function reduceObjectToSettableType<Type extends {
    set: (key: any, value: any) => void
}>(obj: object, initialAcc: Type): Type {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        acc.set(key, value);
        return acc;
    }, initialAcc);
}

export function getFormDataFromObject(o: object): FormData {
    return reduceObjectToSettableType<FormData>(o, new FormData());
}

export function getURLSearchParamsFromObject(o: object): URLSearchParams {
    return reduceObjectToSettableType<URLSearchParams>(o, new URLSearchParams());
}