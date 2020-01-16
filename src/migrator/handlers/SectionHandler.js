// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import { extractHeadingText } from "./Utils";

export default class SectionHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType): boolean {
        return $element.get(0).tagName == "h2";
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        return {elements: [{type: "section", title: extractHeadingText(elements[0], $)}]};
    }
}
