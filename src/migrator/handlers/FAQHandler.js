// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractHeadingText, extractContentHtml} from "./Utils";

const headingRegex = /Frequently Asked Questions|FAQ's/;

export class FAQHandlerVariant_HeadingRegexAndDivWithSchema extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        const $next = $e.next();
        return $e.get(0).tagName == "h2" && $e.text().match(headingRegex)
            && $next.get(0).tagName == "div" && $next.attr("itemtype") == "https://schema.org/FAQPage"
            && $next.find("section").length > 0;
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const $next = $element.next();
        return [$element, $next];
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].find("section").map((i, d) => {
            return {
                question: extractHeadingText($(d).find("strong"), $), 
                answer: extractContentHtml($(d).find("div > div"), $)
            };
        }).get();
        
        return {elements: [{type: "faq", title, items}]};
    }
}
