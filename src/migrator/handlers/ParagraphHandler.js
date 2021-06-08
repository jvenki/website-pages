// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {isElementAValidTextualNode} from "./Utils";
import MigrationError, { ConversionIssueCode, CleanserIssueCode } from "../MigrationError";

export class ParagraphHandler extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return ($e.get(0).tagName == "p" || isElementAValidTextualNode($e));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = $(elements[0]);
        let text = $e.html() || "";
        if (text.length == 0) {
            text = $e.toString();
            if (text == "<br>") {
                text = ""
            }
        }
        return {elements: [{type: "paragraph", data: {text: text}}]};
    }
}