// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractHeadingText, extractContentHtml, isElementAHeadingNode, assert} from "./Utils";
import {chunk, uniq, difference} from "lodash";

export const headingRegex = /Frequently Asked Questions|FAQ/i;

const headingMatchesRegex = ($e) => {
    return (isElementAHeadingNode($e) 
            || $e.get(0).tagName == "strong" 
            || ($e.get(0).tagName == "p" && $e.children().length == 1 && $e.find (" > strong").length == 1))
        && $e.text().match(headingRegex);
};

const assertExtractedDataAndProcess = (items, title, $e) => {
    assert(items.length > 0 && items.every((item) => item.question && item.answer) && Boolean(title), "FAQHandler-CannotExtractQ&A", $e);
    items.forEach((item) => {
        item.question = item.question.replace(/^Q[:.]\s*/, "").replace(/^\d+\. /, "");
        item.answer = item.answer.replace(/^A[:.]\s*/, "").replace(/^<p>A[:.]\s*/, "<p>").replace(/<strong>A[:.]\s*<\/strong>/, "");
    });
};

class FAQBaseHandler extends BaseHandler {
    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const $next = $element.next();
        return [$element, $next];
    }
}

export class FAQHandlerVariant_HeadingRegexAndDivWithSchema extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const $next = $e.next();
        return headingMatchesRegex($e)
            && $next.get(0).tagName == "div" && $next.attr("itemtype") == "https://schema.org/FAQPage"
            && $next.find("section").length > 0;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].find("section").map((i, d) => {
            return {
                question: extractHeadingText($(d).find("strong"), $), 
                answer: extractContentHtml($(d).find("div > div"), $)
            };
        }).get();
        
        assertExtractedDataAndProcess(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByPs extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return headingMatchesRegex($e) && $e.next().length > 0 && $e.next().get(0).tagName == "p";
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
            const question = extractHeadingText(tuple[0], $);
            const answer = tuple[1].map(($a) => extractContentHtml($a, $)).join("");
            return {question, answer};
        });
        
        assertExtractedDataAndProcess(items, title, elements[0]);
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

export class FAQHandlerVariant_HeadingRegexFollowedByH3AndPs extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return headingMatchesRegex($e) 
            && $e.next().length > 0 && $e.next().get(0).tagName == "h3" 
            && $e.next().next().length > 0 && $e.next().next().get(0).tagName == "p";
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const isQuestionElement = ($q: CheerioElemType) => $q && $q.length == 1 && $q.get(0).tagName == "h3";
        const isAnswerElement = ($a: CheerioElemType) => $a && $a.length == 1 && ["p"].includes($a.get(0).tagName) && !isQuestionElement($a);
    
        const elements = [$element];
        let $currElem = $element;
        while (true) {
            const $q = $currElem.next();
            const $a = $q.next();
            if (!isQuestionElement($q) || !isAnswerElement($a)) {
                break;
            }
            elements.push($q, $a);
            $currElem = $a;
        }
        return elements;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = chunk(elements.slice(1), 2).map(([$q, $a]) => {
            const question = extractHeadingText($q, $);
            const answer = extractContentHtml($a, $);
            return {question, answer};
        });
        
        assertExtractedDataAndProcess(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByStrongAndPs extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return headingMatchesRegex($e) 
            && $e.next().length > 0 && $e.next().get(0).tagName == "strong" 
            && $e.next().next().length > 0 && $e.next().next().get(0).tagName == "p";
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const isQuestionElement = ($q: CheerioElemType) => $q && $q.length == 1 && $q.get(0).tagName == "strong";
        const isAnswerElement = ($a: CheerioElemType) => $a && $a.length == 1 && ["p"].includes($a.get(0).tagName) && !isQuestionElement($a);
    
        const elements = [$element];
        let $currElem = $element;
        while (true) {
            const $q = $currElem.next();
            const $a = $q.next();
            if (!isQuestionElement($q) || !isAnswerElement($a)) {
                break;
            }
            elements.push($q, $a);
            $currElem = $a;
        }
        return elements;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = chunk(elements.slice(1), 2).map(([$q, $a]) => {
            const question = extractHeadingText($q, $);
            const answer = extractContentHtml($a, $);
            return {question, answer};
        });
        
        assertExtractedDataAndProcess(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByDetails extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const nextElemIsQ = ($n) => $n.length > 0 && $n.get(0).tagName == "details";
        return headingMatchesRegex($e)  && nextElemIsQ($e.next()); 
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const elements = [$element];
        let $currElem = $element;
        while (true) {
            const $nextElement = $currElem.next();
            if (!$nextElement.length > 0 || $nextElement.get(0).tagName != "details") {
                break;
            }
            elements.push($nextElement);
            $currElem = $nextElement;
        }
        return elements;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const issues = [];
        const items = elements.slice(1).map(($e) => {
            if ($e.find("iframe.video-frame").length > 0) {
                issues.push("FAQ Q&A had a video which was removed as it is not supported");
                $e.find("iframe.video-frame").remove();
            }
            const qns = extractHeadingText($e.find("summary > strong"), $);
            const ans = $e.find("summary").nextAll().map((i, a) => extractContentHtml($(a), $)).get().join("");
            return {question: qns, answer: ans};
        });
        
        assertExtractedDataAndProcess(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}], issues};
    }    
}

export class FAQHandlerVariant_HeadingRegexFollowedByDivOfDetails extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const nextElemIsContainerOfQs = ($n) => $n.length > 0 && $n.get(0).tagName == "div" && $n.find("details").length == $n.children().length;
        return headingMatchesRegex($e)  && nextElemIsContainerOfQs($e.next()); 
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].children().map((i, e) => {
            const $e = $(e);
            const qns = extractHeadingText($e.find("summary > strong"), $) || extractHeadingText($e.find("summary"), $);
            const ans = $e.find("summary").nextAll().map((i, a) => extractContentHtml($(a), $)).get().join("");
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedDataAndProcess(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }    
}

export class FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofP extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const nextElemIsOL = ($n) => {
            return $n.length > 0
                && ["ol", "ul"].includes($n.get(0).tagName)
                && $n.find(" > li").length > 0 
                && $n.find(" > li > strong").length > 0 
                && $n.find(" > li > p, > li > ul").length > 0;
        };
        return headingMatchesRegex($e) && nextElemIsOL($e.next()); 
    }

    validate($e: CheerioElemType, $: CheerioDocType): void {
        if (["ol", "ul"].includes($e.get(0).tagName)) {
            const numberOfItems = $e.find(" > li").length;
            assert($e.find("> li > strong").length == numberOfItems, "FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofP-ConditionNotMet#1", $e);
            assert($e.find(" > li > p, > li > ul").length >= numberOfItems, "FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofP-ConditionNotMet#2", $e);
        }
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].children().map((i, li) => {
            const $li = $(li);
            const $q = $li.find(" > strong");
            const qns = extractHeadingText($q, $);
            const ans = $q.nextAll().map((i, a) => extractContentHtml($(a), $)).get().join("");
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedDataAndProcess(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofTEXT extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const nextElemIsOL = ($n) => {
            return $n.length > 0
                && ["ol", "ul"].includes($n.get(0).tagName)
                && $n.find(" > li").length > 0 
                && $n.find(" > li > strong").length > 0 
                && $n.find(" > li").contents().length >= (2 * $n.find(" > li > strong").length);
        };
        return headingMatchesRegex($e) && nextElemIsOL($e.next()); 
    }

    validate($e: CheerioElemType, $: CheerioDocType): void {
        if (["ol", "ul"].includes($e.get(0).tagName)) {
            const numberOfItems = $e.find(" > li").length;
            assert($e.find("> li > strong").length == numberOfItems, "FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofTEXT-ConditionNotMet#1", $e);
            assert($e.find(">li").get().every((li) => $(li).contents().eq(0).get(0).tagName == "strong"), "FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofTEXT-ConditionNotMet#2", $e);
            assert($e.find(">li").get().every((li) => $(li).contents().eq(1).get(0).type == "text"), "FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofTEXT-ConditionNotMet#3", $e);
        }
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].children().map((i, li) => {
            const $li = $(li);
            const $q = $li.contents().eq(0);
            const qns = extractHeadingText($q, $);
            const ans = $li.contents().get().slice(1).map((a) => extractContentHtml($(a), $)).join("");
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedDataAndProcess(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofPofStrong_AisLIofRest extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const nextElemIsOL = ($n) => {
            return $n.length > 0 
                && ["ul", "ol"].includes($n.get(0).tagName) 
                && $n.find(" > li").length > 0 
                && $n.find(" > li > p:first-child > strong,  > li > em:first-child > strong").length > 0;
        };
        return headingMatchesRegex($e) && nextElemIsOL($e.next()); 
    }

    validate($e: CheerioElemType, $: CheerioDocType): void {
        if ($e.get(0).tagName == "ol") {
            const numberOfItems = $e.find(" > li").length;
            assert($e.find(" > li > p:first-child > strong,  > li > em:first-child > strong").length == numberOfItems, "FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofPofStrong_AisLIofRest-ConditionNotMet#1", $e);
        }
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].children().map((i, li) => {
            const $li = $(li);
            const qns = extractHeadingText($li.find("p > strong, em > strong"), $);
            const ans = $li.children().get().slice(1).map((a) => extractContentHtml($(a), $)).join("");
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedDataAndProcess(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}


export class FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofTEXT_AisLIofP extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const nextElemIsOL = ($n) => {
            const isLIAppro = (li) => li.childNodes.length >= 2 && li.childNodes[0].type == "text" && ["p", "ul", "ol"].includes(li.childNodes[1].tagName);
            return $n.length > 0 
                && ["ul", "ol"].includes($n.get(0).tagName) 
                && $n.find(" > li").length > 0 && isLIAppro($n.find(" > li").eq(0).get(0));
        };
        return headingMatchesRegex($e) && nextElemIsOL($e.next()); 
    }

    validate($e: CheerioElemType, $: CheerioDocType): void {
        if (["ul", "ol"].includes($e.get(0).tagName)) {
            const check = $e.find(" > li").get().every((li) => {
                return li.childNodes.length >= 2 
                    && li.childNodes[0].type == "text"
                    && ["p", "ul", "ol"].includes(li.childNodes[1].tagName);
            });
            assert(check, "FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofTEXT_AisLIofP-ConditionNotMet#1", $e);
        }
    }
    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].find(" > li").map((i, li) => {
            const $li = $(li);
            const qns = $li.contents().eq(0).text();
            const ans = extractContentHtml($li.contents().slice(1), $);
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedDataAndProcess(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByUL_QisLIofH3 extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const nextElemIsUL = ($n) => {
            return $n.length > 0 
                && ["ul", "ol"].includes($n.get(0).tagName) 
                && $n.find(" > li").length > 0 
                && $n.find(" > li > h3").length > 0 
                && $n.find(" > li > p,  > li > ul").length > 0;
        };
        return headingMatchesRegex($e) && nextElemIsUL($e.next()); 
    }

    validate($e: CheerioElemType, $: CheerioDocType): void {
        if (["ol", "ul"].includes($e.get(0).tagName)) {
            const numberOfItems = $e.find(" > li").length;
            assert($e.find(" > li > h3").length == numberOfItems, "FAQHandlerVariant_HeadingRegexFollowedByUL_QisLIofH3-ConditionNotMet#1", $e);
            assert($e.find(" > li > p,  > li > ul").length >= numberOfItems, "FAQHandlerVariant_HeadingRegexFollowedByUL_QisLIofH3-ConditionNotMet#2", $e);
        }
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].find("li > h3").map((i, q) => {
            const $q = $(q);
            const qns = extractHeadingText($q, $);
            const ans = $q.nextAll().map((i, a) => extractContentHtml($(a), $)).get().join("");
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedDataAndProcess(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}

// export class FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisP extends FAQBaseHandler {
//     isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
//         const nextElemIsOL = ($n) => {
//             return $n.length > 0 
//                 && ["ul", "ol"].includes($n.get(0).tagName) 
//                 && $n.find(" > li").length > 0 
//                 && $n.find(" > li > strong").length > 0 
//                 && $n.find(" > p").length > 0;
//         };
//         return headingMatchesRegex($e) && nextElemIsOL($e.next()); 
//     }

//     validate($e: CheerioElemType, $: CheerioDocType): void {
//         if (["ol", "ul"].includes($e.get(0).tagName)) {
//             const numberOfItems = $e.find(" > li").length;
//             assert($e.find(" > li > strong").length == numberOfItems, "FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisP-ConditionNotMet#1", $e);
//             assert($e.find(" > p").length >= numberOfItems, "FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisP-ConditionNotMet#2", $e);
//         }
//     }

//     convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
//         const tillNextQ = ($li) => {
//             // Somehow $li.nextUntil("li") returns all nodes including that of LI. Therefore filtering myself
//             const output = [];
//             while (true) {
//                 $li = $li.next();
//                 if ($li.length == 0 || $li.get(0).tagName == "li") {
//                     return output;
//                 }
//                 output.push($li);
//             }
//         };

//         const title = extractHeadingText(elements[0], $);
//         const items = elements[1].find(" > li").map((i, li) => {
//             const $li = $(li);
//             const qns = extractHeadingText($li.find("strong"), $);  // $SuppressFlowCheck: tillNextQ will always return an array
//             const ans = tillNextQ($li).map(($a) => extractContentHtml($a, $)).join("");
//             return {question: qns, answer: ans};
//         }).get();
        
//         assertExtractedDataAndProcess(items, title, elements[1]);
//         return {elements: [{type: "faq", title, items}]};
//     }
// }

// export class FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofH3_AisP extends FAQBaseHandler {
//     isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
//         const nextElemIsOL = ($n) => {
//             return $n.length > 0 
//                 && ["ul", "ol"].includes($n.get(0).tagName) 
//                 && $n.find(" > li").length > 0 
//                 && $n.find(" > li > h3").length > 0
//                 && $n.find(" > p, > ul").length > 0;
//         };
//         return headingMatchesRegex($e) && nextElemIsOL($e.next()); 
//     }

//     validate($e: CheerioElemType, $: CheerioDocType): void {
//         if (["ol", "ul"].includes($e.get(0).tagName)) {
//             const numberOfItems = $e.find(" > li").length;
//             assert($e.find(" > li > h3").length == numberOfItems, "FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofH3_AisP-ConditionNotMet#1", $e);
//             assert($e.find(" > p, > ul").length == numberOfItems, "FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofH3_AisP-ConditionNotMet#2", $e);
//         }
//     }

//     convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
//         const tillNextQ = ($li) => {
//             // Somehow $li.nextUntil("li") returns all nodes including that of LI. Therefore filtering myself
//             const output = [];
//             while (true) {
//                 $li = $li.next();
//                 if ($li.length == 0 || $li.get(0).tagName == "li") {
//                     return output;
//                 }
//                 output.push($li);
//             }
//         };

//         const title = extractHeadingText(elements[0], $);
//         const items = elements[1].find(" > li").map((i, li) => {
//             const $li = $(li);
//             const qns = extractHeadingText($li.find("h3"), $);   // $SuppressFlowCheck: tillNextQ will always return an array
//             const ans = tillNextQ($li).map(($a) => extractContentHtml($a, $)).join("");
//             return {question: qns, answer: ans};
//         }).get();
        
//         assertExtractedDataAndProcess(items, title, elements[1]);
//         return {elements: [{type: "faq", title, items}]};
//     }
// }

// export class FAQHandlerVariant_HeadingRegexFollowedByOL_QisLI_AisP extends FAQBaseHandler {
//     isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
//         const nextElemIsOL = ($n) => $n.length > 0 && ["ul", "ol"].includes($n.get(0).tagName) && $n.find(" > li").length > 0 && $n.find(" > p").length > 0;
//         return headingMatchesRegex($e) && nextElemIsOL($e.next()); 
//     }

//     convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
//         const tillNextQ = ($li) => {
//             // Somehow $li.nextUntil("li") returns all nodes including that of LI. Therefore filtering myself
//             const output = [];
//             while (true) {
//                 $li = $li.next();
//                 if ($li.length == 0 || $li.get(0).tagName == "li") {
//                     return output;
//                 }
//                 output.push($li);
//             }
//         };

//         const title = extractHeadingText(elements[0], $);
//         const items = elements[1].find(" > li").map((i, li) => {
//             const $li = $(li);
//             const qns = extractHeadingText($li, $);   // $SuppressFlowCheck: tillNextQ will always return an array
//             const ans = tillNextQ($li).map(($a) => extractContentHtml($a, $)).join("");
//             return {question: qns, answer: ans};
//         }).get();
        
//         assertExtractedDataAndProcess(items, title, elements[1]);
//         return {elements: [{type: "faq", title, items}]};
//     }
// }

// export class FAQHandlerVariant_HeadingRegexFollowedByOL_QisLI_AisText extends FAQBaseHandler {
//     isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
//         const nextElemIsOL = ($n) => {
//             return $n.length > 0 
//                 && ["ul", "ol"].includes($n.get(0).tagName) 
//                 && $n.find(" > li").length > 0 
//                 && $n.find(" > li").get().every((li) => li.nextSibling.type == "text");
//         };
//         return headingMatchesRegex($e) && nextElemIsOL($e.next()); 
//     }

//     convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
//         const tillNextQ = ($li) => {
//             let li = $li.get(0);
//             // Somehow $li.nextUntil("li") returns all nodes including that of LI. Therefore filtering myself
//             const output = [];
//             while (true) {
//                 li = li.nextSibling;
//                 if (!li || li.tagName == "li") {
//                     return output;
//                 }
//                 output.push($(li));
//             }
//         };

//         const title = extractHeadingText(elements[0], $);
//         const items = elements[1].find(" > li").map((i, li) => {
//             const $li = $(li);
//             const qns = extractHeadingText($li, $);   // $SuppressFlowCheck: tillNextQ will always return an array
//             const ans = tillNextQ($li).map(($a) => extractContentHtml($a, $)).join("");
//             return {question: qns, answer: ans};
//         }).get();
        
//         assertExtractedDataAndProcess(items, title, elements[1]);
//         return {elements: [{type: "faq", title, items}]};
//     }
// }

export class FAQHandlerVariant_HeadingRegexFollowedByULasQAndPasA extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return headingMatchesRegex($e) && this._isQuestionElement($e.next()) && this._isAnswerElement($e.next().next()); 
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const elements = [$element];
        let $currElem = $element;
        while (true) {
            const $q = $currElem.next();
            const $a = $q.next();
            if (!this._isQuestionElement($q) || !this._isAnswerElement($a)) {
                break;
            }
            elements.push($q, $a);
            $currElem = $a;
        }
        return elements;
    }    

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = chunk(elements.slice(1), 2).map(([$q, $a]) => {
            const qns = extractHeadingText($q.find("strong"), $);
            const ans = extractContentHtml($a, $);
            return {question: qns, answer: ans};
        });
        
        assertExtractedDataAndProcess(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }

    _isQuestionElement($e: CheerioElemType) {
        return $e && $e.length == 1 && ["ul", "ol"].includes($e.get(0).tagName) && $e.children().length == 1 && $e.find(" > li > strong").length == 1;
    }

    _isAnswerElement($e: CheerioElemType) {
        return $e && $e.length == 1 && $e.get(0).tagName == "p";
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByOLofH3 extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const nextElemIsOL = ($n) => {
            const childTags = $n.find(" > *").map((i, c) => c.tagName).get();
            return $n.length > 0 && ["ul", "ol"].includes($n.get(0).tagName) && childTags.length > 0 && difference(uniq(childTags), ["h3"]).length == 0;
        };
        return headingMatchesRegex($e) && nextElemIsOL($e.next()); 
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const issues = [];
        const items = elements[1].find(" > h3").map((i, item) => {
            const $q = $(item).find(" > li > strong");
            const qns = extractHeadingText($q, $);
            const ans = $q.nextAll().map((i, a) => extractContentHtml($(a), $)).get().join("");
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedDataAndProcess(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}], issues};
    }
}

export class FAQInsideAccordionPanelHandler extends FAQBaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        return ($element.hasClass("ln-accordion") || $element.hasClass("twi-accordion") || $element.hasClass("panel"))
            && $element.find(".panel-title").text().match(headingRegex);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0].find(".panel-title a"), $);
        const panelBody = elements[0].find(".panel-body");
        const items = panelBody.find("ul > h3, ul > li > h3,  ol > li > h3, ol > li > strong, ol > h3 > strong").map((i, q) => {
            const $q = $(q);
            const qns = extractHeadingText($q, $);
            const ans = $q.nextUntil("h3,li").map((i, a) => extractContentHtml($(a), $)).get().join("");
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedDataAndProcess(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}
