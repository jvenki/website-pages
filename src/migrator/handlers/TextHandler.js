// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractContentHtml, isElementAContentNode} from "./Utils";

export default class TextHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType) {
        return isElementAContentNode($element);
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const elements = [$element];
        let $currElem = $element;
        while (true) {
            // Cheerio through *children* and *next* allows only element traversal and not content traversal. Therefore look into browser based DOM Nodes
            const domSibling = $currElem.get(0).nextSibling;
            const $nextElem = domSibling && domSibling.type == "text" ? $(domSibling) : $currElem.next();
            if ($nextElem.length == 0 || !isElementAContentNode($nextElem)) {
                break;
            }
            elements.push($nextElem);
            $currElem = $nextElem;
        }
        return elements;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const body = elements.map(($element, i) => extractContentHtml($element, $)).join("");
        if (!body) {
            return {elements: []};
        }
        return {elements: [{type: "text", body}]};
    }
}
