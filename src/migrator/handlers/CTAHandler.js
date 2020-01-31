// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractLinkText, assert} from "./Utils";

export class CTAHandlerVariant_ProductLandingBlock extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType): boolean {
        return $element.hasClass("product-landing-btn-block");
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        assert($element.children().length == 1, "CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#1", $element);
        assert($element.find("div.link-section").length == 1, "CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#2", $element);
        assert($element.find("div.link-section").children().length == 1, "CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#3", $element);
        assert($element.find("div.link-section span").length == 1, "CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#4", $element);
        assert($element.find("div.link-section span").children().length == 1, "CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#5", $element);
        assert($element.find("div.link-section span a").length == 1, "CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#6", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const link = $element.find("a").attr("href");
        if (!link) {
            return {elements: [], issues: ["Found a CTA without HREF. Ignoring it"]};
        }
        const linkText = extractLinkText($element.find("a"), $);
        return {elements: [{type: "cta", link, linkText}]};
    }
}

export class CTAHandlerVariant_LonelyLink extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType): boolean {
        const $p = $e.parent();
        return $e.get(0).tagName == "a" && $p.get(0).tagName == "div" 
            && ($p.hasClass("text-center") || $p.hasClass("text-left")) && $p.children().length == 1;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const link = $element.attr("href");
        if (!link) {
            return {elements: [], issues: ["Found a CTA without HREF. Ignoring it"]};
        }

        const linkText = extractLinkText($element, $);
        return {elements: [{type: "cta", link, linkText}]};
    }
}

export class CTAHandlerVariant_CtaSection extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType): boolean {
        return $e.hasClass("link-section") || $e.hasClass("cta-section");
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        // assert($element.find("a").length == 1, "CTAHandlerVariant_CtaSection-ConditionNotMet#1", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const link = $element.find("a").attr("href");
        if (!link) {
            return {elements: [], issues: ["Found a CTA without HREF. Ignoring it"]};
        }

        const linkText = extractLinkText($element.find("a"), $);
        const linkTextStartPos = $element.text().indexOf(linkText);
        const prefix = $element.text().substring(0, linkTextStartPos).trim();
        const suffix = $element.text().substring(linkTextStartPos + linkText.length).trim();
        const convElement = {type: "cta", link, linkText}; // $SuppressFlowCheck
        if (prefix) convElement.prefix = prefix; // $SuppressFlowCheck
        if (suffix) convElement.suffix = suffix;
        return {elements: [convElement]};
    }
}

