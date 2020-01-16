// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractHeadingText, extractContentHtml, isElementAHeadingNode, assert} from "./Utils";
import { ConversionIssueCode } from "../MigrationError";

export class JumbotronHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType): boolean {
        return $element.hasClass("jumbotron");
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        let title;
        if (isElementAHeadingNode($element.children().eq(0))) {
            title = extractHeadingText($element.children().eq(0), $);
        }
        const items = $element.children().slice(title ? 1 : 0).map((i, e) => extractContentHtml($(e), $));
        const body = items.get().join("");
        assert(Boolean(body), ConversionIssueCode.EMPTY_ELEMENT, $element);
        return {elements: [{type: "panel", title, body}]};
    }
}