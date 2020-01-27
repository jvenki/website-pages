// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {assert, extractHeadingText, extractContentHtml, isElementATextualNode, isElementASubHeadingNode, isElementATableNode} from "./Utils";
import MigrationError, {ConversionIssueCode} from "../MigrationError";

export default class TextHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType) {
        return isElementATextualNode($element) || isElementASubHeadingNode($element) || isElementATableNode($element);
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const elements = [$element];
        let $currElem = $element;
        while (true) {
            // Cheerio through *children* and *next* allows only element traversal and not content traversal. Therefore look into browser based DOM Nodes
            const domSibling = $currElem.get(0).nextSibling;
            const $nextElem = domSibling && domSibling.type == "text" ? $(domSibling) : $currElem.next();
            if ($nextElem.length == 0 || !(isElementATextualNode($nextElem) || isElementATableNode($nextElem))) {
                break;
            }
            elements.push($nextElem);
            $currElem = $nextElem;
        }
        return elements;
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        const elemType = $element.get(0).tagName;
        assert(isElementATextualNode($element) || isElementASubHeadingNode($element) || isElementATableNode($element), "TextHandler-ConditionNotMet for " + elemType, $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        let title = "";
        let body = "";
        elements.forEach(($element, i) => {
            if (isElementASubHeadingNode($element) && !title) {
                title = extractHeadingText($element, $);
            } else if (isElementASubHeadingNode($element) || isElementATextualNode($element)) {
                body += extractContentHtml($element, $);
            } else if (isElementATableNode($element)) {
                const prevElement = elements[i-1];
                if ( prevElement && isElementATableNode(prevElement)) {
                    // Two Tables next to each other will make it look as a single table. Insert a BR. Thats why hungry-table anyway does through margin-bottom;
                    body += "<br/>";
                }
                body += extractContentHtml($element, $);
            } else {
                throw new MigrationError(ConversionIssueCode.NON_CONTENT_NODE);
            }
        });
        if (!title && !body) {
            return {elements: []};
        }
        return {elements: [{type: "text", title, body}]};
    }
}
