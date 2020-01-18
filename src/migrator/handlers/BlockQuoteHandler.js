// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractHeadingText, extractContentHtml, isElementAHeadingNode, assert} from "./Utils";

export default class BlockQuoteHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType): boolean {
        return $element.get(0).tagName == "blockquote";
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        let title;
        if (isElementAHeadingNode($element.children().eq(0))) {
            title = extractHeadingText($element.children().eq(0), $);
        }
        const body = $element.children().slice(title ? 1 : 0).map((i, e) => extractContentHtml($(e), $)).get().join("");
        assert(Boolean(body), "BlockQuoteHandler-ConditionNotMet#1", $element);
        return {elements: [{type: "blockquote", title, body}]};
    }
}
