// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractContentHtml, isElementAContentNode} from "./Utils";

export class TextHandlerVariant_Main extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        return isElementAContentNode($element);
    }

    // Commenting out this code because DocBuilder handles Text specially by anyway concatenating and thus
    // there shouldnt be any regression (as confirmed by our Unit Test Code)
    // The presence of this code is making the other priority handlers to not do its job properly before
    // this aggressive merging.
    // walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
    //     const elements = [$element];
    //     let $currElem = $element;
    //     while (true) {
    //         // Cheerio through *children* and *next* allows only element traversal and not content traversal. Therefore look into browser based DOM Nodes
    //         const domSibling = $currElem.get(0).nextSibling;
    //         const $nextElem = domSibling && domSibling.type == "text" ? $(domSibling) : $currElem.next();
    //         if ($nextElem.length == 0 || !isElementAContentNode($nextElem)) {
    //             break;
    //         }
    //         elements.push($nextElem);
    //         $currElem = $nextElem;
    //     }
    //     return elements;
    // }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const body = elements.map(($element, i) => extractContentHtml($element, $)).join("");
        if (!body) {
            return {elements: []};
        }
        return {elements: [{type: "text", body}]};
    }
}

export class TextHandlerVariant_PointerView extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        return $element.hasClass("pointer-view") && $element.next().hasClass("tcenter");
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        return [$element, $element.next()];
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const body = elements[1].find("p").map((i, p) => `<li>${$(p).text()}</li>`).get().join("");
        return {elements: [{type: "text", body: `<ol>${body}</ol>`}], issues: ["PointerView changed into simple OL"]};
    }    
}