// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractHeadingText, extractContentHtml} from "./Utils";

export const headingRegex = /Frequently Asked Questions|FAQ's|FAQs/;

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

export class FAQHandlerVariant_HeadingRegexFollowedByPs extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        return $e.get(0).tagName == "h2" && $e.text().match(headingRegex) && $e.next().get(0).tagName == "p";
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const expandToGetAllElementsForThisAnswer = ($a) => {
            const output = [$a];
            while ($a.next().length > 0 && this._isAnswerElement($a.next())) {
                output.push($a.next());
                $a = $a.next();
            }
            return output;
        };
                
        const elements = [$element];
        let $currElem = $element;
        while (true) {
            const $q = $currElem.next();
            const $a = $q.next();
            if (!this._isQuestionElement($q) || !this._isAnswerElement($a)) {
                break;
            }
            const $aExpanded = expandToGetAllElementsForThisAnswer($a);
            // Unfortunately, because of the contract dictated by BaseHandler, even though we exactly know what is a Q and a Ans now, we 
            // still need to flatten it out into a single 1D array and again do the same operation during convert.
            elements.push($q, ...$aExpanded);
            $currElem = $aExpanded[$aExpanded.length-1];
        }
        return elements;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const tuples = this._createQnATuples(elements.slice(1));
        const items = tuples.map((tuple) => {
            const question = extractHeadingText(tuple[0], $).replace(/^Q: /, "");
            const answer = tuple[1].map(($a) => extractContentHtml($a, $)).join("").replace(/^A: /, "");
            return {question, answer};
        });
        
        return {elements: [{type: "faq", title, items}]};
    }

    _isQuestionElement($q: CheerioElemType) {
        return $q && $q.length == 1 && $q.get(0).tagName == "p" 
            && $q.children().length > 0 && $q.children().first().get(0).tagName == "strong";
    }

    _isAnswerElement($a: CheerioElemType) {
        return $a && $a.length == 1 && ["p", "ul"].includes($a.get(0).tagName) && !this._isQuestionElement($a);
    }

    _createQnATuples(elements: Array<CheerioElemType>) {
        const output = [];
        for (let i=0; i<elements.length;) {
            const tuple = [elements[i++], [elements[i++]]];
            while (true && i<elements.length) {
                if (this._isQuestionElement(elements[i])) {
                    break;
                }
                tuple[1].push(elements[i++]);
            }
            output.push(tuple);
        }
        return output;
    }
}

