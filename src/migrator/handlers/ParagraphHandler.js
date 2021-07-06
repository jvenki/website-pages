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
        const generatedElements = [];
        for (let i=0; i< elements.length; i++) {
            const $e = $(elements[i]);
            let text = $e.prop("nodeName") == "A" ? $e.toString() : ($e.html() || "");
            if (text.length == 0) {
                text = $e.toString();
                if (text == "<br>") {
                    text = "";
                }
            }
            generatedElements.push({type: "paragraph", data: {text: text}});
        }
        
        return {elements: generatedElements};
    }
}