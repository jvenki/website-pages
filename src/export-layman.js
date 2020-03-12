const MongoNativeClient = require("mongodb").MongoClient;
import fs from "fs";
import {sortBy, uniq} from "lodash";
import pretty from "pretty";

async function main() {
    let collection;
    let nativeClient;
    await MongoNativeClient.connect("mongodb://localhost:27017")
        .then((client) => {
            const db = client.db("pages");
            nativeClient = client;
            collection = db.collection("pages");
        })
        .catch((err) => {
            console.error(err);
        });

    const rows = await collection.find({conversionStatus: "ERROR"}).toArray();

    const errorDistribution = {};
    rows.forEach((row) => {
        if (!row.conversionError.code) {
            return;
        } else if (["LPD_CORRUPTED", "UNKNOWN_TAG - IdentifyHandler for div.sitemap", "Maximum call stack size exceeded", "Cannot read property 'tagName' of undefined"].includes(row.conversionError.message)) {
            return;
        }
        const errorCategory = row.conversionError.code;
        let errorKey;
        switch (row.conversionError.message) {
            case "Possible FAQ/RelatedArticles Section found as TEXTs": errorKey = "Possibly a FAQ or References"; break;
            case "VALIDATION_FAILED_HANDLER - Local Link used": errorKey = "Local Link used"; break;
            
            case "VALIDATION_FAILED_HANDLER - CTA given without a Link": 
            case "VALIDATION_FAILED_HANDLER - CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#1":
            case "VALIDATION_FAILED_HANDLER - CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#3":
                errorKey = "CTA given without a Link"; 
                break;

            case "OTHERS - Possible FAQ/RelatedArticles Section found as TEXTs":
            case "VALIDATION_FAILED_HANDLER - FAQHandler-CannotExtractQ&A":
            case "VALIDATION_FAILED_HANDLER - FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofP-ConditionNotMet#1":
            case "VALIDATION_FAILED_HANDLER - FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofP-ConditionNotMet#2":
            case "VALIDATION_FAILED_HANDLER - FAQHandlerVariant_HeadingRegexFollowedByUL_QisLIofH3-ConditionNotMet#1":
            case "VALIDATION_FAILED_HANDLER - FAQHandlerVariant_HeadingRegexFollowedByUL_QisLIofH3-ConditionNotMet#2":
            case "VALIDATION_FAILED_HANDLER - FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofTEXT_AisLIofP-ConditionNotMet#1":
            case "VALIDATION_FAILED_HANDLER - FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofPofStrong_AisLIofRest-ConditionNotMet#1":
            case "VALIDATION_FAILED_HANDLER - FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofTEXT-ConditionNotMet#1":
            case "VALIDATION_FAILED_HANDLER - FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofTEXT-ConditionNotMet#3":
                errorKey = "FAQ Pattern Issues"; 
                break;

            case "VALIDATION_FAILED_HANDLER - AccordionHandler-ConditionNotMet#2":
            case "VALIDATION_FAILED_HANDLER - AccordionHandler-ConditionNotMet#4":
            case "VALIDATION_FAILED_HANDLER - AccordionHandler-ConditionNotMet#6":
                errorKey = "Accordion Defn Issues"; 
                break;

            
            case "VALIDATION_FAILED_HANDLER - ReferencesHandler-CannotExtractReferences": 
            case "VALIDATION_FAILED_HANDLER - ReferencesHandlerVariant_ProductsInvest-ConditionNotMet#1":
                errorKey = "References Pattern Issues"; 
                break;
            
            // case "VALIDATION_FAILED_W3C": errorKey = ""; break;
            // case "abc": errorKey = ""; break;
            // case "abc": errorKey = ""; break;
            default: 
                if (["UNKNOWN_TAG"].includes(errorCategory)) {
                    errorKey = "Unknown Tag";
                } else if (["NON_CONTENT_NODE", "VALIDATION_FAILED_W3C", "VALIDATION_FAILED_HANDLER"].includes(errorCategory)) {
                    errorKey = "Content Issues";
                } else if (["HEADING_HAS_CHILDREN"].includes(errorCategory)) {
                    errorKey = "H2 Issues";
                } else if (["HTML_PARSE_ERROR"].includes(errorCategory)) {
                    errorKey = "HTML Parse Error";
                } else if (["MULTIPLE_DISCLAIMER"].includes(errorCategory)) {
                    errorKey = "Multiple Disclaimer Found";
                } else if (["MULTIPLE_FAQ"].includes(errorCategory)) {
                    errorKey = "Multiple FAQ Found";
                } else {
                    errorKey = row.conversionError.message;
                }
        }
        if (!errorDistribution[errorKey]) {
            errorDistribution[errorKey] = [];
        }
        errorDistribution[errorKey].push(row);
    });

    const sortedErrorKeys = Object.keys(errorDistribution).sort((k1, k2) => errorDistribution[k2].length - errorDistribution[k1].length);

    sortedErrorKeys.forEach((key) => {
        let fileContent = "";
        errorDistribution[key].forEach((row) => {
            fileContent += "\n\n************************************************************************************************************************\n\n";
            fileContent += `LPD ID = "${row.id}" : Namespace = "${row.namespace}" \n`;
            fileContent += `MD URL = https://ops.stg1.bankbazaar.com/editLandingPageData.html?id=${row.id}\n`;
            if (row.service == "mp") {
                fileContent += `BB URL = https://www.bankbazaar.com/${row.namespace}.html\n`;
            } else {
                fileContent += `BB URL = https://www.bankbazaarinsurance.com/${row.namespace}.html\n`;
            }
            fileContent += `Issue Faced = "${row.conversionError.message}"\n`;
            if (row.conversionError.payload) {
                fileContent += `Element =\n${pretty(row.conversionError.payload, {ocd: true})}\n`;
            }
        });
        fs.writeFileSync(`./build/errors/${key}.txt`, fileContent);
    });

    nativeClient.close();
}

main();