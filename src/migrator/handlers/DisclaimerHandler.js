// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractContentHtml} from "./Utils";

export class DisclaimerHandlerVariant_Regex extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType): boolean {
        return $element.find("*").length == 0 && $element.text().match(/\*This article is provided only for consumer information on an/);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        return {elements: [{type: "disclaimer", text: extractContentHtml(elements[0], $)}]};
    }
}
