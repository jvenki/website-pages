// @flow
import schema from "./DocSchema.json";
import Ajv from "ajv";
const { HtmlValidate } = require('html-validate')
import cheerio from "cheerio";
import {DocValidatorIssueCode, default as MigrationError} from "./MigrationError";
import {allRules, rulesToBeKept} from "./IgnoredRules";
import allowedTags from "./allowed-tags.json";

let ajv;
const getJSONSchemaValidator = () => {
    if (!ajv) {
        ajv = new Ajv();
        ajv.addKeyword({
            keyword: "validateHtml",
            type: "string",
            schemaType: "boolean",
            validate: async (validateHtml, data, ctx, datacxt) => {
                if(validateHtml) {
                    return await Promise.all([allowedTagsValidator(data, datacxt)]);
                } else {
                    return Promise.resolve(true);
                }
            },
            async: true
        });
    }
    const val = ajv.compile(schema);
    return val;
}

const allowedTagsValidator = (data, datacxt): Promise<boolean> | Promise<MigrationError> =>  {
    const elementsAreOfAllowedType = ($element, $, errors) => {
        if (!allowedTags.includes($element.get(0).tagName)) {
            return {
                isValid: false,
                errors: errors.push(
                    {
                        invalidTag: $element.get(0).tagName,
                        dataPath: datacxt.dataPath
                    })
            };
        }
        if($element.children().length == 0) {
            return {
                isValid: true,
                errors: []
            };
        }
        return {
            isValid: !$element.children().map((i, child) => elementsAreOfAllowedType($(child), $, errors)).get().some((val) => val.isValid == false),
            errors
        };
    };
    const $ = cheerio.load(data);
    const allElementsAreOfAllowedType = elementsAreOfAllowedType($("body"), $, []);
    if (allElementsAreOfAllowedType.isValid) {
        return Promise.resolve(true);    
    }
    return Promise.reject(new MigrationError(DocValidatorIssueCode.UNEXPECTED_TAGS, "Unexpected tag(s) while processing" , JSON.stringify(allElementsAreOfAllowedType.errors)));
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
    const validate = getJSONSchemaValidator();;
    let result;
    try{
        await validate(jsonToBeValidated);
        result = true;
    } catch (ex) {
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
