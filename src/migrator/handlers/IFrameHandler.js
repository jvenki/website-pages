// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";

export default class IFrameHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType): boolean {
        return $element.get(0).tagName == "iframe";
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        return {elements: [{type: "iframe", link: $element.attr("data-src") || $element.attr("src")}]};
    }
}
