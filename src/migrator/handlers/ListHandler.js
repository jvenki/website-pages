// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractContentHtml, isElementMadeUpOfOnlyWithGivenDescendents} from "./Utils";
import MigrationError, { ConversionIssueCode, CleanserIssueCode } from "../MigrationError";
import { containsOnlyGridCellClasses } from "./UnwrapHandler";

export class ListHandler extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return ((($e.get(0).tagName == "ul"|| 
            $e.get(0).tagName == "ol") && hasLiElementsWithOnlyOnePTag($e, $) ) || 
            (isDivMadeUpOfULOrOL($e, $) && hasLiElementsWithOnlyOnePTag($e.childAt(0), $)));
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
        let content = "";
        content = $(li).html();
        content = content.replace("<p>", "").replace("</p>", "").replace(/<ul>(.*)<\/ul>/, "");
        let items = [];
        if ($(li).find("ul").length>0 || $(li).find("ol").length > 0) {
            items = constructItems($(li), $); 
        }
        const element = {content};
        if (items.length > 0) {
            element.items = items;
        }
        return element;
    }).get();
}

const hasLiElementsWithOnlyOnePTag = ($e, $) => {
    let valid = true;
    $e.find("li").map((i, li) => {
        const pTags = $(li).find("p").length;
        if (pTags.length > 1) {
            valid = false;
        }
    }).get();
    return valid;
}

const isDivMadeUpOfULOrOL = ($e, $) => isElementMadeUpOfOnlyWithGivenDescendents($e, ["ul", "ol"], $);
