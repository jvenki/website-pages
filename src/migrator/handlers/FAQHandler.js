// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractHeadingText, extractContentHtml, isElementAHeadingNode, assert} from "./Utils";
import {chunk, uniq, difference} from "lodash";

export const headingRegex = /Frequently Asked Questions|FAQ/i;

const assertExtractedData = (items, title, $e) => assert(items.length > 0 && items.every((item) => item.question && item.answer) && Boolean(title), "FAQHandler-CannotExtractQ&A", $e);

class FAQBaseHandler extends BaseHandler {
    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const $next = $element.next();
        return [$element, $next];
    }
}

export class FAQHandlerVariant_HeadingRegexAndDivWithSchema extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        const $next = $e.next();
        return $e.get(0).tagName == "h2" && $e.text().match(headingRegex)
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
        
        assertExtractedData(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByPs extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        return isElementAHeadingNode($e) && $e.text().match(headingRegex) && $e.next().get(0).tagName == "p";
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
        
        assertExtractedData(items, title, elements[0]);
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
    isCapableOfProcessingElement($e: CheerioElemType) {
        return isElementAHeadingNode($e) && $e.text().match(headingRegex) && $e.next().get(0).tagName == "h3" && $e.next().next().get(0).tagName == "p";
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
            const question = extractHeadingText($q, $).replace(/^\d+. /, "").replace(/^Q: /, "");
            const answer = extractContentHtml($a, $).replace(/^A: /, "");
            return {question, answer};
        });
        
        assertExtractedData(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByDetails extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        const nextElemIsQ = ($n) => $n.get(0).tagName == "details";
        return isElementAHeadingNode($e) && $e.text().match(headingRegex)  && nextElemIsQ($e.next()); 
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
        
        assertExtractedData(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}], issues};
    }    
}

export class FAQHandlerVariant_HeadingRegexFollowedByDivOfDetails extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        const nextElemIsContainerOfQs = ($n) => $n.get(0).tagName == "div" && $n.find("details").length == $n.children().length;
        return isElementAHeadingNode($e) && $e.text().match(headingRegex)  && nextElemIsContainerOfQs($e.next()); 
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].children().map((i, e) => {
            const $e = $(e);
            const qns = extractHeadingText($e.find("summary > strong"), $);
            const ans = $e.find("summary").nextAll().map((i, a) => extractContentHtml($(a), $)).get().join("");
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedData(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }    
}

export class FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisLIofP extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        const nextElemIsOL = ($n) => {
            return $n.get(0).tagName == "ol" 
                && $n.find(" > li").length > 0 
                && $n.find(" > li > strong").length == $n.find(" > li").length 
                && $n.find(" > li > p, > li > ul").length >= $n.find(" > li").length;
        };
        return isElementAHeadingNode($e) && $e.text().match(headingRegex) && nextElemIsOL($e.next()); 
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
        
        assertExtractedData(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofPofStrong extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        const nextElemIsOL = ($n) => $n.get(0).tagName == "ol" && $n.find(" > li").length > 0 && $n.find(" > li > p:first-child > strong").length == $n.find(" > li").length;
        return isElementAHeadingNode($e) && $e.text().match(headingRegex) && nextElemIsOL($e.next()); 
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].children().map((i, li) => {
            const $li = $(li);
            const qns = extractHeadingText($li.find("p > strong"), $);
            const ans = extractContentHtml($li.children().eq(1), $);
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedData(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByUL_QisLIofH3 extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        const nextElemIsUL = ($n) => {
            return ["ul", "ol"].includes($n.get(0).tagName) 
                && $n.find(" > li").length > 0 
                && $n.find(" > li > h3").length == $n.find(" > li").length 
                && $n.find(" > li > p").length == $n.find(" > li").length;
        };
        return isElementAHeadingNode($e) && $e.text().match(headingRegex) && nextElemIsUL($e.next()); 
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].find("li > h3").map((i, q) => {
            const $q = $(q);
            const qns = extractHeadingText($q, $);
            const ans = $q.nextAll().map((i, a) => extractContentHtml($(a), $)).get().join("");
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedData(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByOL_QisLIofStrong_AisP extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        const nextElemIsOL = ($n) => ["ul", "ol"].includes($n.get(0).tagName) && $n.find(" > li").length > 0 && $n.find(" > li > strong").length == $n.find(" > li").length && $n.find(" > p").length == $n.find(" > li").length;
        return isElementAHeadingNode($e) && $e.text().match(headingRegex) && nextElemIsOL($e.next()); 
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const tillNextQ = ($li) => {
            // Somehow $li.nextUntil("li") returns all nodes including that of LI. Therefore filtering myself
            const output = [];
            while (true) {
                $li = $li.next();
                if ($li.length == 0 || $li.get(0).tagName == "li") {
                    return output;
                }
                output.push($li);
            }
        };

        const title = extractHeadingText(elements[0], $);
        const items = elements[1].find(" > li").map((i, li) => {
            const $li = $(li);
            const qns = extractHeadingText($li.find("strong"), $);
            const ans = tillNextQ($li).map(($a) => extractContentHtml($a, $)).join("");
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedData(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByOL_QisLI_AisP extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        const nextElemIsOL = ($n) => ["ul", "ol"].includes($n.get(0).tagName) && $n.find(" > li").length > 0 && $n.find(" > p").length > 0;
        return isElementAHeadingNode($e) && $e.text().match(headingRegex) && nextElemIsOL($e.next()); 
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const tillNextQ = ($li) => {
            // Somehow $li.nextUntil("li") returns all nodes including that of LI. Therefore filtering myself
            const output = [];
            while (true) {
                $li = $li.next();
                if ($li.length == 0 || $li.get(0).tagName == "li") {
                    return output;
                }
                output.push($li);
            }
        };

        const title = extractHeadingText(elements[0], $);
        const items = elements[1].find(" > li").map((i, li) => {
            const $li = $(li);
            const qns = extractHeadingText($li, $);
            const ans = tillNextQ($li).map(($a) => extractContentHtml($a, $)).join("");
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedData(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByULAsQAndPAsA extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        return isElementAHeadingNode($e) && $e.text().match(headingRegex) && this._isQuestionElement($e.next()) && this._isAnswerElement($e.next().next()); 
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
        
        assertExtractedData(items, title, elements[1]);
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
    isCapableOfProcessingElement($e: CheerioElemType) {
        const nextElemIsOL = ($n) => {
            const childTags = $n.find(" > *").map((i, c) => c.tagName).get();
            return ["ul", "ol"].includes($n.get(0).tagName) && childTags.length > 0 && difference(uniq(childTags), ["h3"]).length == 0;
        };
        return isElementAHeadingNode($e) && $e.text().match(headingRegex) && nextElemIsOL($e.next()); 
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
        
        assertExtractedData(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}], issues};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByOL_QisText_AisP extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        const nextElemIsOL = ($n) => {
            return ["ul", "ol"].includes($n.get(0).tagName) 
                && $n.find(" > li").length > 0 
                && $n.find(" > li").get().every((li) => {
                    return li.childNodes.length == 2 
                        && li.childNodes[0].type == "text"
                        && li.childNodes[1].tagName == "p";
                });
        };
        return isElementAHeadingNode($e) && $e.text().match(headingRegex) && nextElemIsOL($e.next()); 
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].find(" > li").map((i, li) => {
            const $li = $(li);
            const qns = $li.contents().eq(0).text();
            const ans = extractContentHtml($li.contents().slice(1), $);
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedData(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}


export class FAQInsideAccordionPanelHandler extends FAQBaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType) {
        return ($element.hasClass("ln-accordion") || $element.hasClass("twi-accordion") || $element.hasClass("panel"))
            && $element.find(".panel-title").text().match(headingRegex);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0].find(".panel-title a"), $);
        const panelBody = elements[0].find(".panel-body");
        const items = panelBody.find("ul > h3, ul > li > h3,  ol > li > h3, ol > li > strong, ol > h3 > li > strong").map((i, q) => {
            const $q = $(q);
            const qns = $q.parent().get(0).tagName == "ul" ? extractHeadingText($q.find("li"), $) : extractHeadingText($q, $);
            const ans = $q.nextUntil("h3,li").map((i, a) => extractContentHtml($(a), $)).get().join("");
            return {question: qns, answer: ans};
        }).get();
        
        assertExtractedData(items, title, elements[1]);
        return {elements: [{type: "faq", title, items}]};
    }
}
