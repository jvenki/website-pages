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
        const assertAllChildrenAsPanel = () => $element.children().first().children().get().every((c) => c.tagName == "div" && $(c).hasClass("panel"));

        assert($element.children().length == 1 && $element.children().first().hasClass("panel-group"), "AccordionHandler-ConditionNotMet#1", $element);        
        assert(assertAllChildrenAsPanel(), "AccordionHandler-ConditionNotMet#2", $element);
        assert(panels.length > 0, "AccordionHandler-ConditionNotMet#3", $element);
        assert($element.find(".panel .panel-heading").length == panels.length, "AccordionHandler-ConditionNotMet#4", $element);
        assert($element.find(".panel .panel-heading a").length == panels.length, "AccordionHandler-ConditionNotMet#5", $element);
        assert($element.find(".panel .panel-body").length == panels.length, "AccordionHandler-ConditionNotMet#6", $element);
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
