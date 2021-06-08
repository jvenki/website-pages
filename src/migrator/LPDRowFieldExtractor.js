const parseString = require("xml2js").parseString;
import MigrationError, {ErrorCode} from "./MigrationError";
import cheerio from "cheerio";
import {ProductTypeIdMapping, PageTypeCategoryMapping} from "./Constants";
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
        
        if (!output.title) {
            output.title = deduceTitleFromContent(output.primaryContent);
        }
        return output;
    }

    extractAllAttributes(row) {
        const output = {config: {}};
        const detailJSON = parseXmlString(row.detail);
        const messagingMap = detailJSON["com.bankbazaar.model.LandingPageDataDetail"]["messagingMap"];
        
        messagingMap[0]["entry"].forEach((attr) => {
            switch (attr.string[0]) {
                case "H1_TITLE": 
                    output.config.h1Title = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                    break;
                case "PRIMARY_CONTENT": 
                    output.config.primaryContent = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                    break;
                case "META_TITLE": 
                    output.config.metaTitle = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                    break;
                case "META_KEYWORD": 
                    output.config.metaKeyword = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                    break;
                case "META_DESCRIPTION": 
                    output.config.metaDescription = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                    break;
                
                
            }
        });
        
        if (!output.h1Title) {
            output.config.h1Title = deduceTitleFromContent(output.config.primaryContent);
        }
        const imageMap = detailJSON["com.bankbazaar.model.LandingPageDataDetail"]["imageMap"];
        if (imageMap[0].entry) {
            imageMap[0]["entry"].forEach((attr) => {
                switch (attr.string[0]) {
                    case "H1_IMAGE": 
                        const id = parseInt(attr.int[1]);
                        if (id != "NaN") {
                            output.config.h1Image = {id: parseInt(attr.int[1])};
                        }
                        break;
                    }
            });
        }
        const attributeMap = detailJSON["com.bankbazaar.model.LandingPageDataDetail"]["attributeMap"];
        attributeMap[0]["entry"].forEach((attr) => {
            switch (attr.string[0]) {
                case "PERMANENT_REDIRECT_URL": 
                    output.config.redirectUrl = attr.string[1];
                    break;
                case "CITY_ID": 
                    output.cityId = parseInt(attr.string[1]);
                    break;
                case "CREDIT_CARD_ID": 
                    output.creditCardId = parseInt(attr.string[1]);
                    break;
                case "CREDIT_CARD_GROUP_ID": 
                    output.creditCardGroupId = parseInt(attr.string[1]);
                    break;
                case "ANDROID_DEEP_LINK": 
                    output.config.androidDeepLink = attr.string[1];
                    break;
                case "HIDE_ELIG_FORM": 
                    output.config.hideEligForm = attr.string[1] == "true";
                    break;
                case "VISIBLE_OFFER_IDS": 
                    output.config.offerIds = attr.string[1].split(",");
                    break;
                case "USER_REVIEW_KEYWORDS": 
                    output.config.userReviewKeywords = attr.string[1];
                    break;
                }
        });
        output.productType = ProductTypeIdMapping[row.product_type_id];
        output.bankId = row.bank_id;
        const pageTypeCategoryMapping = PageTypeCategoryMapping[row.landing_page_type];
        output.pageType = pageTypeCategoryMapping.pageType;
        output.category = pageTypeCategoryMapping.category;
        delete output.config.primaryContent;
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


const deduceTitleFromContent = function (html) {
    const $ = cheerio.load(html, {decodeEntities: false});
    return $("h1").first().text();
};