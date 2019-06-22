const DomWalker = require("./DomWalker");
const Cleanser = require("./Cleanser");
const DocCreator = require("./DocCreator");
const parseString = require("xml2js").parseString;
const MigrationError = require("./MigrationError");
const winston = require("winston");

class LpdXml2Json {
    toJSON(xml) {
        winston.verbose(`Processing ${xml.id} with namespace ${xml.namespace}`);
        const output = {doc: {}};
        output.id = output.doc.id = xml.id;
        output.namespace = output.doc.namespace = xml.namespace;
        try {
            Object.assign(output.doc, extractKeyElementsOutOfXML(xml));
            output.doc.newPrimaryContent = fromHTMLToJSON(output.doc.oldPrimaryContent);
            //output.doc.newSecondaryContent = fromHTMLToJSON(output.doc.oldSecondaryContent);
            output.conversionStatus = "SUCCESS";
        } catch (e) {
            output.conversionStatus = "ERROR";
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
    return {title, oldPrimaryContent: primaryContent, oldSecondaryContent: secondaryContent};
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
    return DomWalker.for(new Cleanser().cleanse(html)).forCreatingDoc(new DocCreator()).startWalking();
};

module.exports = LpdXml2Json;