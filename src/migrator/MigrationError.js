const ErrorCode = {
    LPD_CORRUPTED: {code: "LPD_CORRUPTED", message: "The LPD has no messagingMap or zero entries in that"},
    LPD_CORRUPTED_NO_PRI: {code: "LPD_CORRUPTED_NO_PRI", message: "The LPD has no Primary Content defined"},
    LPD_CORRUPTED_NO_SEC: {code: "LPD_CORRUPTED_NO_SEC", message: "The LPD has no Secondary Content defined"},
    HTML_PARSE_ERROR: {code: "HTML_PARSE_ERROR", message: "HTML-Minifier is unable to parse the given HTML"},
    DOM_EMPTY: {code: "DOM_EMPTY", message: "DOM doesnt have any nodes under html -> body"},
    UNKNOWN_TAG: {code: "UNKNOWN_TAG", message: "We dont know how to handle the Tag"},
    MULTIPLE_DISCLAIMER: {code: "MULTIPLE_DISCLAIMER", message: "We already have added one Disclaimer"},
    MULTIPLE_REFERENCES: {code: "MULTIPLE_REFERENCES", message: "We already have added one collection of references"}
};

class MigrationError extends Error {
    constructor(errorCode, info, payload) {
        super(errorCode.message + (info ? ". " + info : ""));
        this.code = errorCode.code;
        this.payload = payload;
    }
}

MigrationError.Code = ErrorCode;

module.exports = MigrationError;