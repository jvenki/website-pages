// @flow
export const ErrorCode = {
    LPD_CORRUPTED: {code: "LPD_CORRUPTED", message: "The LPD has no messagingMap or zero entries in that"},
    HTML_PARSE_ERROR: {code: "HTML_PARSE_ERROR", message: "HTML-Minifier is unable to parse the given HTML"},
    DOM_EMPTY: {code: "DOM_EMPTY", message: "DOM doesnt have any nodes under html -> body"},
    UNKNOWN_TAG: {code: "UNKNOWN_TAG", message: "We dont know how to handle the Tag"},
    SNAPSHOT_MISMATCH: {code: "SNAPSHOT_MISMATCH", message: "The snapshot has changed from what was manually validated as correct migration"},
    MONGO_MISMATCH: {code: "MONGO_MISMATCH", message: "The snapshot has changed from what was stored previously in MongoDB"},
};

export const ConversionIssueCode = {
    EMPTY_ELEMENT: {code: "EMPTY_ELEMENT", message: "Conversion has resulted in an undefined element"},
    GRID_MULTIPLE_H2: {code: "GRID_MULTIPLE_H2", message: "Grid already has more than one H2 tag"},
    GRID_MULTIPLE_ITEMS_IN_CELL: {code: "GRID_MULTIPLE_ITEMS_IN_CELL", message: "Grid has more than one item in a single cell"},
    MULTIPLE_DISCLAIMER: {code: "MULTIPLE_DISCLAIMER", message: "We already have added one Disclaimer"},
    MULTIPLE_FAQ: {code: "MULTIPLE_FAQ", message: "We already have added one FAQ"},
    MULTIPLE_SITEMAP: {code: "MULTIPLE_SITEMAP", message: "We already have added one Sitmap"},
    MULTIPLE_NEWS_FEED: {code: "MULTIPLE_NEWS_FEED", message: "We already have added one News Feed"},
    MULTIPLE_NEWS_FEED_FULL_POSTS: {code: "MULTIPLE_NEWS_FEED_FULL_POSTS", message: "We already have added one News Feed Full Posts"},
    HEADING_HAS_CHILDREN: {code: "HEADING_HAS_CHILDREN", message: "Heading Node should not have any children"},
    NON_CONTENT_NODE: {code: "NON_CONTENT_NODE", message: "The element has HTML tags used which dont represent Textual/Tabular Nodes"},
    VALIDATION_FAILED_W3C: {code: "VALIDATION_FAILED_W3C", message: "The element doesnt conform to HTML spec for the element"},
    VALIDATION_FAILED_HANDLER: {code: "VALIDATION_FAILED_HANDLER", message: "The element doesnt conform to handler spec for the element"},
    OTHERS: {code: "OTHERS", message: ""}
};

export const CleanserIssueCode = {
    MANUAL_CORRECTION: {code: "MANUAL_CORRECTION", message: "Moved element from its current place to right place"},
    REMOVED_EMPTY_NODES: {code: "REMOVED_EMPTY_NODES", message: "Removed empty nodes"},
    REMOVED_NODES: {code: "REMOVED_NODES", message: "Removed script nodes"},
    REMOVED_HFM_NODE: {code: "REMOVED_HFM_NODE", message: "Unwanted DIV node with HFM Classes"},
    REMOVED_GRID_ROW_NODE: {code: "REMOVED_GRID_ROW_NODE", message: "Unwanted DIV node with row sized grid classes"},
    REMOVED_TOC: {code: "REMOVED_TOC", message: "Removed TOC"},
    REMOVED_DISQUS: {code: "REMOVED_DISQUS", message: "Removed DisQus Thread Blocks"},
    REMOVED_OFFER: {code: "REMOVED_OFFER", message: "Removed Offer Containers"},
    REMOVED_UNWANTED_HEADINGS_INSIDE_REFERENCES: {code: "REMOVED_HEADINGS_INSIDE_REFERENCES", message: "Removed Unwanted Headings inside references"}
};

export const DocValidatorIssueCode = {
    INVALID_HTML: {code: "INVALID_HTML", message: "Doc contains html that does not meet W3C standards"},
    INVALID_SCHEMA: {code: "INVALID_SCHEMA", message: "Doc does not meet the schema that is used for ajv validation"},
    UNEXPECTED_TAGS: {code: "UNEXPECTED_TAGS", message: "Doc contains tags which are disallowed"}
};

export default class MigrationError extends Error {
    code: Object;
    payload: ?string;

    constructor(errorCode: Object, info: ?string, payload: ?string) {
        const msg = errorCode.code + (info ? " - " + info : "");
        super(msg);
        this.code = errorCode.code;
        this.payload = payload;
    }
}
