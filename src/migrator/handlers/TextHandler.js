// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {assert, extractHeadingText, extractContentHtml, isElementATextualNode, isElementASubHeadingNode} from "./Utils";
import MigrationError, {ConversionIssueCode} from "../MigrationError";

export default class TextHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType) {
        return isElementATextualNode($element) || isElementASubHeadingNode($element);
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const elements = [$element];
        let $currElem = $element;
        while (true) {
            const $nextElem = $currElem.next();
            if ($nextElem.length == 0 || !isElementATextualNode($nextElem)) {
                break;
            }
            elements.push($nextElem);
            $currElem = $nextElem;
        }
        return elements;
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        const elemType = $element.get(0).tagName;
        assert(isElementATextualNode($element) || isElementASubHeadingNode($element), "TextHandler-ConditionNotMet for " + elemType, $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        let title = "";
        let body = "";
        elements.forEach(($element) => {
            if (isElementASubHeadingNode($element) && !title) {
                title = extractHeadingText($element, $);
            } else if (isElementASubHeadingNode($element) || isElementATextualNode($element)) {
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
