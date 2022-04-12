/**
 * @property {number} _id Unique Comment ID
 * @property {number} post_id Unique ID of the post the comment is under
 * @property {string} body Decoded comment body text
 * @property {string} link HREF to the comment
 * @property {('question'|'answer')} post_type The type of post the comment is under (either Q or A)
 * @property {[string]} blacklist_matches Array of strings that correspond to matched patterns in the body
 * @property {number} noise_ratio What percentage of total length of the body is noise
 * @property {boolean} can_flag Whether or not a comment is flaggable
 * @property {boolean} [was_flagged] Whether or not the comment has been flagged
 * @property {boolean} [was_deleted] Whether or not the comment is/was deleted
 */
export interface Comment {
    _id: number,
    post_id: number,
    body: string,
    link: string,
    post_type: ('question' | 'answer'),
    blacklist_matches: [string],
    noise_ratio: number,
    can_flag: boolean,
    was_flagged?: boolean,
    was_deleted?: boolean
}


/**
 * Errors used to differentiate the various failure modes
 */
export class FlagAttemptFailed extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FlagAttemptFailed'
    }
}

export class RatedLimitedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RatedLimitedError'
    }
}