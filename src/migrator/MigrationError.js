// @flow
export const ErrorCode = {
    LPD_CORRUPTED: {code: "LPD_CORRUPTED", message: "The LPD has no messagingMap or zero entries in that"},
    HTML_PARSE_ERROR: {code: "HTML_PARSE_ERROR", message: "HTML-Minifier is unable to parse the given HTML"},
    DOM_EMPTY: {code: "DOM_EMPTY", message: "DOM doesnt have any nodes under html -> body"},
    UNKNOWN_TAG: {code: "UNKNOWN_TAG", message: "We dont know how to handle the Tag"},
    SNAPSHOT_MISMATCH: {code: "SNAPSHOT_MISMATCH", message: "The snapshot has changed from what was manually validated as correct migration"}
};

export const ConversionIssueCode = {
    EMPTY_ELEMENT: {code: "EMPTY_ELEMENT", message: "Conversion has resulted in an undefined element"},
    GRID_MULTIPLE_H2: {code: "GRID_MULTIPLE_H2", message: "Grid already has more than one H2 tag"},
    GRID_MULTIPLE_ITEMS_IN_CELL: {code: "GRID_MULTIPLE_ITEMS_IN_CELL", message: "Grid has more than one item in a single cell"},
    MULTIPLE_DISCLAIMER: {code: "MULTIPLE_DISCLAIMER", message: "We already have added one Disclaimer"},
    MULTIPLE_FAQ: {code: "MULTIPLE_FAQ", message: "We already have added one FAQ"},
    HEADING_HAS_CHILDREN: {code: "HEADING_HAS_CHILDREN", message: "Heading Node should not have any children"},
    NON_CONTENT_NODE: {code: "NON_CONTENT_NODE", message: "The element has HTML tags used which dont represent Textual/Tabular Nodes"},
    OTHERS: {code: "OTHERS", message: ""}
};

export const CleanserIssueCode = {
    MANUAL_CORRECTION: {code: "MANUAL_CORRECTION", message: "Moved element from its current place to right place"},
    REMOVED_EMPTY_NODES: {code: "REMOVED_EMPTY_NODES", message: "Removed empty nodes"},
    REMOVED_SCRIPT_NODES: {code: "REMOVED_SCRIPT_NODES", message: "Removed script nodes"},
    REMOVED_STYLE_NODES: {code: "REMOVED_STYLE_NODES", message: "Removed style nodes"},
    REMOVED_HFM_NODE: {code: "REMOVED_HFM_NODE", message: "Unwanted DIV node with HFM Classes"},
    REMOVED_GRID_ROW_NODE: {code: "REMOVED_GRID_ROW_NODE", message: "Unwanted DIV node with row sized grid classes"},
    REMOVED_TOC: {code: "REMOVED_TOC", message: "Removed TOC"},
    REMOVED_DISQUS: {code: "REMOVED_DISQUS", message: "Removed DisQus Thread Blocks"},
    REMOVED_OFFER: {code: "REMOVED_OFFER", message: "Removed Offer Containers"},
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

    toString() {
        let output = this.message;
        if (this.payload) {
            output += ` Element: \n${this.payload}`;
        }
        return output;
    }
}
