// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {headingRegex as faqHeadingRegex, FAQInsideAccordionPanelHandler} from "./FAQHandler";
import {headingRegex as referencesHeadingRegex, ReferencesHandlerVariant_Accordion} from "./ReferencesHandler";

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
        assert($element.find(".panel .panel-heading").length == panels.length, "AccordionHandler-ConditionNotMet#2", $element);
        assert($element.find(".panel .panel-heading a").length == panels.length, "AccordionHandler-ConditionNotMet#3", $element);
        assert($element.find(".panel .panel-body").length == panels.length, "AccordionHandler-ConditionNotMet#4", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const items = [];
        let faq;
        let reference;
        elements.forEach(($element) => {
            $element.find(".panel").each((i, panel) => {
                const $be = $(panel).find(".panel-body");
                const title = extractHeadingText($(panel).find(".panel-heading a"), $);
                if (isPanelActuallyAFAQ(title)) {
                    faq = new FAQInsideAccordionPanelHandler().convert([$(panel)], $).elements[0];
                } else if (isPanelActuallyAReference(title)) {
                    reference = new ReferencesHandlerVariant_Accordion().convert([$(panel)], $).elements[0];
                } else {
                    const body = extractContentHtml($be, $);
                    items.push({title, body});
                }
            });
        });

        const targetElements = [];
        const issues = [];
        if (faq) {
            targetElements.push(faq);
            issues.push("Accordion Panel converted to FAQ");
        }
        if (reference) {
            targetElements.push(reference);
            issues.push("Accordion Panel converted to RelatedArticles");
        }
        if (items.length > 0) {
            targetElements.push({type: "accordion", items});
        }
        return {elements: targetElements, issues};
    }
}

const isPanelActuallyAFAQ = (title) => title.match(faqHeadingRegex);
const isPanelActuallyAReference = (title) => title.match(referencesHeadingRegex);