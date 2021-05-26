// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractContentHtml, isElementMadeUpOfOnlyWithGivenDescendents} from "./Utils";
import MigrationError, { ConversionIssueCode, CleanserIssueCode } from "../MigrationError";
import { containsOnlyGridCellClasses } from "./UnwrapHandler";

export class ListHandler extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return ($e.get(0).tagName == "ul"|| $e.get(0).tagName == "ol" || isDivMadeUpOfULOrOL($e, $));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = isDivMadeUpOfULOrOL($(elements[0]), $) ? $(elements[0]).childAt(0) : $(elements[0]);
        const style = $e.get(0).tagName == "ul" ? "unordered": "ordered";
        const items = constructItems($e, $);
        return {elements: [{type: "list", data: {style, items}}]};
    }
}

const constructItems = ($e, $) => {
    return $e.find("li").map((i, li)=> {
        const content = $(li).html();
        let items = [];
        if ($(li).find("ul").length>0 || $(li).find("ol").length > 0) {
            items = constructItems($(li), $); 
        }
        return {content, items};
    }).get();
}

const isDivMadeUpOfULOrOL = ($e, $) => isElementMadeUpOfOnlyWithGivenDescendents($e, ["ul", "ol"], $);
