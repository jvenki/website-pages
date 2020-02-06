// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {assert} from "./Utils";

export class VideoHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType): boolean {
        return $element.hasClass("video-section");
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        assert($element.children().length == 1, "VideoHandler-ConditionNotMet#1", $element);
        assert($element.find("iframe").length == 1, "VideoHandler-ConditionNotMet#2", $element);
        assert(Boolean($element.find("iframe").attr("data-src") || $element.find("iframe").attr("src")), "VideoHandler-ConditionNotMet#3", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        return {elements: [{type: "video", link: $element.find("iframe").attr("data-src") || $element.find("iframe").attr("src")}]};
    }
}
