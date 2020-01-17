// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";

export default class NoopWarningHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType): boolean {
        const e = $element.get(0);
        if (e.tagName == "div") {
            // We dont blindly allow DIVs in our conversion. 
            if ($element.hasClass("col-md-12")) {
                if ($element.children().eq(0).get(0).tagName != "h2") {
                    return false;
                }
                if ($element.find(".lp-widget-details").length != $element.children().length-1) {
                    return false;
                }
                return true;
            }
        }

        return false;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const convertedElements = [];
        const issues = [];
        const $element = elements[0];
        if ($element.hasClass("col-md-12")) {
            issues.push("NoopWarningConverter ('col.md-12.lp-widget-details')");
        }

        return {elements: convertedElements, issues: issues};
    }
}