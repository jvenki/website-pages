// @flow
import schema from "./DocSchema.json";
import Ajv from "ajv";
const { HtmlValidate } = require('html-validate')
import {DocValidatorIssueCode, default as MigrationError} from "./MigrationError";
import {allRules, rulesToBeKept} from "./IgnoredRules";
import {allowedTagsValidator} from "./handlers/Utils";

let ajv;
const getJSONSchemaValidator = () => {
    if (!ajv) {
        ajv = new Ajv();
        ajv.addKeyword({
            keyword: "validateHtml",
            type: "string",
            schemaType: "boolean",
            validate: (validateHtml, data, ctx, datacxt) => {
                if(validateHtml) {
                    return allowedTagsValidator(data, datacxt);
                } else {
                    return true;
                }
            }
        });
    }
    return ajv;
}



const w3cHtmlValidator = async (data, datacxt) => {
    const createDocumentFromFragment = fragment => `<!DOCTYPE html><html lang="en"><head><title>Document from fragment</title></head><body>${data}</body></html>`
    const result = new HtmlValidate(allRules).validateString(createDocumentFromFragment(data));
    const isValidHtml =  result.valid;
    if (isValidHtml) {
        return Promise.resolve(true);
    }
    return Promise.reject(new MigrationError(DocValidatorIssueCode.INVALID_HTML, "Does not follow w3c standards", {...result, dataPath: datacxt.dataPath}));
};

export const validateJsonSchema = async (jsonToBeValidated: Object, onIssue: (err: MigrationError) => void) => {
    const ajv = getJSONSchemaValidator();;
    let result;
    try{
        result = ajv.validate(schema, jsonToBeValidated);
        console.log("errors ", ajv.errors)
        if (ajv.errors) {
            ajv.errors.map((error) => onIssue(new MigrationError(DocValidatorIssueCode.INVALID_SCHEMA, "Schema invalid", JSON.stringify(error))));
        }
    } catch (ex) {
        console.error(ex);
        console.log("final", JSON.stringify(ex));
        result = false;
        if(!(ex instanceof MigrationError)) {
            onIssue(new MigrationError(DocValidatorIssueCode.INVALID_SCHEMA, "Schema invalid", JSON.stringify(ex)));
        } else {
            onIssue(ex);
        }
    }
    // console.log(result)
    return result;
}
