// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractContentHtml, extractLink, extractLinkText} from "./Utils";

const regex = /\*This article is provided only for consumer information on an|^\*Disclaimer: Bankbazaar makes no guarantee/g;

export class DisclaimerHandlerVariant_Regex extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType): boolean {
        return $element.find("*").length == 0 && $element.text().match(regex);
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

export class DisclaimerHandlerVariant_Accordion extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return $e.hasClass("twi-accordion") && $e.find(".panel-title").text() == "Disclaimer";
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const targetElements = elements[0].find(".panel-body").map((i, body) => {
            const text = extractContentHtml($(body), $);
            return {type: "disclaimer", text};
        }).get();
        return {elements: targetElements};
    }
}

export class DisclaimerHandlerVariant_Link extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType): boolean {
        const doesLinkPointToDisclaimer = (link) => link && link.indexOf("disclaimer") >= 0;
        const hasChildAnchor = ($e) => $e.children().length == 1 && $e.find("a").length == 1;
        const isAnchor = ($e) => $e.get(0).tagName == "a";
        return (isAnchor($element) && doesLinkPointToDisclaimer($element.attr("href"))) || (hasChildAnchor($element) && doesLinkPointToDisclaimer($element.find("a").attr("href")));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = elements[0];
        const $a = $e.get(0).tagName == "a" ? $e : $e.find("a");
        return {elements: [{type: "disclaimer", link: extractLink($a), linkText: extractLinkText($a, $)}]};
    }
}