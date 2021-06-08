// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {headingRegex as faqHeadingRegex, FAQInsideAccordionPanelHandler} from "./FAQHandler";
import {ReferencesHandlerVariant_Accordion} from "./ReferencesHandler";
import {extractHeadingText, extractContentHtml, assert, handleChildrenOfCompoundElements} from "./Utils";

export class AccordionHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType): boolean {
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
        const assertAllChildrenAsPanel = () => $element.children().first().children().get().every((c) => c.tagName == "div" && $(c).hasClass("panel"));

        // assert($element.children().length == 1 && $element.children().first().hasClass("panel-group"), "AccordionHandler-ConditionNotMet#1", $element);        
        assert(assertAllChildrenAsPanel(), "AccordionHandler-ConditionNotMet#2", $element);
        assert(panels.length > 0, "AccordionHandler-ConditionNotMet#3", $element);
        assert($element.find(".panel .panel-heading").length == panels.length, "AccordionHandler-ConditionNotMet#4", $element);
        assert($element.find(".panel .panel-heading a").length == panels.length || $element.find(".panel .panel-heading h2, .panel .panel-heading h3").length == panels.length, "AccordionHandler-ConditionNotMet#5", $element);
        assert($element.find(".panel .panel-body").length == panels.length, "AccordionHandler-ConditionNotMet#6", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const items = [];
        const issues = [];

        let faq;
        const references = [];
        elements.forEach(($element) => {
            $element.find(".panel").each((i, panel) => {
                const $panel = $(panel);
                if (isPanelActuallyAFAQ($panel, $)) {
                    faq = new FAQInsideAccordionPanelHandler().convert([$(panel)], $).elements[0];
                } else if (isPanelActuallyAReference($panel, $)) {
                    const reference = new ReferencesHandlerVariant_Accordion().convert([$(panel)], $).elements[0];
                    references.push(reference);
                } else {
                    let $titleElem;
                    if ($(panel).find(".panel-heading a").length > 0) {
                        $titleElem = $(panel).find(".panel-heading a");
                    } else if ($(panel).find(".panel-heading h2").length > 0) {
                        $titleElem = $(panel).find(".panel-heading h2");
                    } else if ($(panel).find(".panel-heading h3").length > 0) {
                        $titleElem = $(panel).find(".panel-heading h3");
                    } 
                    const title = extractHeadingText($titleElem, $);
                    const $bodyElem = $(panel).find(".panel-body").children();
                    const {targetElements, issuesInChildren} = handleChildrenOfCompoundElements($bodyElem, $);
                    assert(Boolean(targetElements.length>0) && Boolean(title), "AccordionHandler-ConditionNotMet#7", $element);
                    items.push({title, elements: targetElements});
                    issues.push(...issuesInChildren);
                }
            });
        });

        const targetElements = [];
        if (faq) {
            targetElements.push(faq);
            issues.push("Accordion Panel converted to FAQ");
        }
        if (references.length > 0) {
            targetElements.push(...references);
            issues.push("Accordion Panels converted to RelatedArticles");
        }
        if (items.length > 0) {
            items.forEach((item) => {
                targetElements.push({type: "accordion", data: item});
            });
        }
        return {elements: targetElements, issues};
    }
}

const isPanelActuallyAFAQ = ($panel, $) => {
    const title = extractHeadingText($panel.find(".panel-heading a"), $);
    return title.match(faqHeadingRegex);
};

const isPanelActuallyAReference = ($panel, $) => {
    const $panelBody = $panel.find(".panel-body");
    if (new ReferencesHandlerVariant_Accordion().isCapableOfProcessingElement($panel, $)) {
        return true;
    } else if ($panelBody.children().length == 1 && $panelBody.find(">table td > a").length > 0) {
        const cells = $panelBody.find(">table td").get();
        const check = cells.filter((cell) => Boolean($(cell).html())).every((cell) => {
            const $cell = $(cell);
            if ($cell.children().length == 1 && $cell.find(">a").length == 1 && $cell.text() == ("• " + $cell.find(">a").text())) {
                return true;
            }
        });
        return check;
    }
    return false;
};
