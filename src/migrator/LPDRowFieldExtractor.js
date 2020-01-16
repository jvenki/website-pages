const parseString = require("xml2js").parseString;
import MigrationError, {ErrorCode} from "./MigrationError";

export default class LPDRowFieldExtractor {
    extractFrom(row) {
        const output = {};
        const detailJSON = parseXmlString(row.detail);
        if (detailJSON == undefined) {
            throw new MigrationError(ErrorCode.LPD_CORRUPTED);
        }
        const messagingMap = detailJSON["com.bankbazaar.model.LandingPageDataDetail"]["messagingMap"];
        if (messagingMap.length > 1 || !messagingMap[0].entry) {
            throw new MigrationError(ErrorCode.LPD_CORRUPTED);
        }
        messagingMap[0]["entry"].forEach((attr) => {
            switch (attr.string[0]) {
                case "H1_TITLE": 
                    output.title = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                    break;
                case "PRIMARY_CONTENT": 
                    output.primaryContent = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                    break;
                case "SECONDARY_CONTENT":
                    output.secondaryContent = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                    break;
            }
        });

        if (!output.primaryContent) {
            throw new MigrationError(ErrorCode.LPD_CORRUPTED);
        }
        
        return output;
    }
}

// This is the only way to make parseString to parse Synchronously
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
