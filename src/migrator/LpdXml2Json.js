const parseString = require("xml2js").parseString;
const MigrationError = require("./MigrationError");

const parseXmlString = function(xmlRow) {
    let output;
    parseString(xmlRow, function (err, jsonRow) {
        if (!jsonRow || !jsonRow["com.bankbazaar.model.LandingPageDataDetail"]["messagingMap"]) {
            return undefined;
        }
        output = jsonRow;
    });
    return output;
};

class LpdXml2Json {
    convert(xmlRow) {
        const jsonRow = parseXmlString(xmlRow.detail);
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
        return {id: xmlRow.id, namespace: xmlRow.namespace, title, primaryContent, secondaryContent};
    }
}

module.exports = LpdXml2Json;