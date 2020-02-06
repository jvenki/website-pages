// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractContentHtml} from "./Utils";

export class DisclaimerHandlerVariant_Regex extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType): boolean {
        return $element.find("*").length == 0 && $element.text().match(/\*This article is provided only for consumer information on an/);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        return {elements: [{type: "disclaimer", text: extractContentHtml(elements[0], $)}]};
    }
}

export class DisclaimerHandlerVariant_GridOfAccordions extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const allChildrenAreAccordion = () => $e.children().get().every((c) => $(c).hasClass("twi-accordion"));
        const allAccordionAreDisclaimers = () => {
            const accordions = $e.find(".twi-accordion");
            const panelTitles = $e.find(".twi-accordion h2.panel-title").get();
            return panelTitles.length == accordions.length && panelTitles.every((c) => $(c).text() == "Disclaimer");
        };
        return $e.hasClass("row") && allChildrenAreAccordion() && allAccordionAreDisclaimers();
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const targetElements = elements[0].find(".twi-accordion").map((i, root) => {
            const text = extractContentHtml($(root).find(".panel-body"), $);
            return {type: "disclaimer", text};
        }).get();
        return {elements: targetElements};
    }
}