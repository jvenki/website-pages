// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import { assert } from "./Utils";

export default class IFrameHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType): boolean {
        return $element.get(0).tagName == "iframe";
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        assert(Boolean($element.attr("data-src") || $element.attr("src")), "IFrameHandler-ConditionNotMet#1", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        return {elements: [{type: "iframe", link: $element.attr("data-src") || $element.attr("src")}]};
    }
}
