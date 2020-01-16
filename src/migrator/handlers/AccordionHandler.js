// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractHeadingText, extractContentHtml, assert} from "./Utils";

export class AccordionHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType): boolean {
        return $element.hasClass("twi-accordion");
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const elements = [$element];
        while (true) {
            $element = $element.next();
            if (!$element || !$element.hasClass("twi-accordion")) {
                break;
            }
            elements.push($element);
        }
        return elements;
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        const panels = $element.find(".panel");
        assert(panels.length > 0, "AccordionHandler-ConditionNotMet#1", $element);
        assert($element.find(".panel .panel-heading h2").length == panels.length, "AccordionHandler-ConditionNotMet#2", $element);
        assert($element.find(".panel .panel-heading h2 a").length == panels.length, "AccordionHandler-ConditionNotMet#3", $element);
        assert($element.find(".panel .panel-body").length == panels.length, "AccordionHandler-ConditionNotMet#4", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const items = [];
        elements.forEach(($element) => {
            $element.find(".panel").each((i, panel) => {
                const title = extractHeadingText($(panel).find(".panel-heading h2 a"), $);
                const body = extractContentHtml($(panel).find(".panel-body"), $);
                items.push({title, body});
            });
        });
        return {elements: [{type: "accordion", items}]};
    }
}
