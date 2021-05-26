// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractContentHtml} from "./Utils";
import MigrationError, { ConversionIssueCode, CleanserIssueCode } from "../MigrationError";
import { containsOnlyGridCellClasses } from "./UnwrapHandler";

export class HeaderHandler extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return ($e.get(0).tagName == "h1"|| $e.get(0).tagName == "h2" || $e.get(0).tagName == "h3" || $e.get(0).tagName == "h4" || $e.get(0).tagName == "h5" || $e.get(0).tagName == "h6");
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = $(elements[0]);
        const text = $e.html();
        const level = parseInt($e.get(0).tagName.replace("h", ""));
        return {elements: [{type: "header", data: {text: text, level: level}}]};
    }
}