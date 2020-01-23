// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {headingRegex as faqHeadingRegex, FAQInsideAccordionPanelHandler} from "./FAQHandler";
import {extractHeadingText, extractContentHtml, assert} from "./Utils";

export class AccordionHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType): boolean {
        return $element.hasClass("twi-accordion") || $element.hasClass("ln-accordion");
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const elements = [$element];
        while (true) {
            $element = $element.next();
            if (!$element || !($element.hasClass("twi-accordion") || $element.hasClass("ln-accordion"))) {
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
        const faq = {type: "faq", title: "", items: []};
        elements.forEach(($element) => {
            $element.find(".panel").each((i, panel) => {
                const $be = $(panel).find(".panel-body");
                const title = extractHeadingText($(panel).find(".panel-heading h2 a"), $);
                if (isPanelActuallyAFAQ(title)) {
                    faq.title = title;
                    faq.items = new FAQInsideAccordionPanelHandler().convert([$be], $).elements[0].items;
                } else {
                    const body = extractContentHtml($be, $);
                    items.push({title, body});
                }
            });
        });

        const targetElements = [{type: "accordion", items}];
        const issues = [];
        if (faq.title) {
            targetElements.push(faq);
            issues.push("Accordion Panel converted to FAQ");
        }
        return {elements: targetElements, issues};
    }
}

const isPanelActuallyAFAQ = (title) => title.match(faqHeadingRegex);