const DomWalker = require("./DomWalker");
const Cleanser = require("./Cleanser");
const parseString = require("xml2js").parseString;
const MigrationError = require("./MigrationError");
const winston = require("winston");
const minify = require("html-minifier").minify;

class LpdXml2Json {
    toJSON(xml) {
        winston.verbose(`Processing ${xml.id} with namespace ${xml.namespace}`);
        const output = {};
        output.id = xml.id;
        output.namespace = xml.namespace;
        try {
            Object.assign(output, extractKeyElementsOutOfXML(xml));
            const primaryContentConversionResult = fromHTMLToJSON(output.oldPrimaryContent);
            output.doc = primaryContentConversionResult.doc;
            output.conversionStatus = primaryContentConversionResult.status;
            output.conversionIssues = primaryContentConversionResult.issues;
        } catch (e) {
            output.conversionStatus = "ERROR";
            output.conversionError = e;
            output.conversionErrorCode = e.code;
            output.conversionErrorMessage = e.toString();
            output.conversionErrorPayload = e.payload;
        }
        return output;
    }
}

const extractKeyElementsOutOfXML = (xml) => {
    const jsonRow = parseXmlString(xml.detail);
    if (jsonRow == undefined) {
        throw new MigrationError(MigrationError.Code.LPD_CORRUPTED);
    }
    const messagingMap = jsonRow["com.bankbazaar.model.LandingPageDataDetail"]["messagingMap"];
    if (messagingMap.length > 1 || !messagingMap[0].entry) {
        throw new MigrationError(MigrationError.Code.LPD_CORRUPTED);
    }
    const attrMap = messagingMap[0]["entry"];
    let title, primaryContent, secondaryContent;
    attrMap.forEach((attr) => {
        switch (attr.string[0]) {
            case "H1_TITLE": 
                title = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                break;
            case "PRIMARY_CONTENT": 
                primaryContent = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                break;
            case "SECONDARY_CONTENT":
                secondaryContent = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                break;
        }
    });
    return {
        title, 
        oldPrimaryContent: minify(primaryContent, {collapseWhitespace: true, removeComments: true, continueOnParseError: true})
    };
};

const parseXmlString = function(xml) {
    let output;
    parseString(xml, function (err, jsonRow) {
        if (!jsonRow || !jsonRow["com.bankbazaar.model.LandingPageDataDetail"]["messagingMap"]) {
            return undefined;
        }
        output = jsonRow;
    });
    return output;
};

const fromHTMLToJSON = (html) => {
    return DomWalker.for(new Cleanser().cleanse(html)).executeFirstPass().executeSecondPass().finish();
};

module.exports = LpdXml2Json;