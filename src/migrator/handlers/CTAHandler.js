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
