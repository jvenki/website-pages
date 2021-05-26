// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractLink, extractLinkText, assert, extractHeadingText, extractContentHtml, isElementMadeUpOfOnlyWithGivenDescendents} from "./Utils";

const assertExtractedData = (link, linkText, $e) => {
    assert(Boolean(link), "CTA given without a Link", $e);
    assert(Boolean(link), "CTA given without a Text", $e);
};

export class CTAHandlerVariant_ProductLandingBlock extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType): boolean {
        return $element.hasClass("product-landing-btn-block");
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        assert($element.children().length == 1, "CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#1", $element);
        assert($element.find("div.link-section").length == 1, "CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#2", $element);
        assert($element.find("div.link-section").children().length == 1, "CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#3", $element);
        //assert($element.find("div.link-section span").length == 1, "CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#4", $element);
        //assert($element.find("div.link-section span").children().length == 1, "CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#5", $element);
        // assert($element.find("div.link-section span a").length == 1, "CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#6", $element);
        assert($element.find("div.link-section a").length == 1, "CTAHandlerVariant_ProductLandingBlock-ConditionNotMet#6", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const link = extractLink($element.find("a"));
        const linkText = extractLinkText($element.find("a"), $);
        assertExtractedData(link, linkText, $element);
        return {elements: [{type: "cta", data: {link, linkText}}]};
    }
}

export class CTAHandlerVariant_LonelyLink extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        const $p = $e.parent();
        return $e.get(0).tagName == "a" && $p.get(0).tagName == "div" 
            && ($p.hasClass("text-center") || $p.hasClass("text-left")) && $p.children().length == 1;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const link = extractLink($element);
        const linkText = extractLinkText($element, $);
        assertExtractedData(link, linkText, $element);
        return {elements: [{type: "cta", data: {link, linkText}}]};
    }
}

export class CTAHandlerVariant_CtaSection extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        return $e.hasClass("link-section") || $e.hasClass("cta-section");
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        // assert($element.find("a").length == 1, "CTAHandlerVariant_CtaSection-ConditionNotMet#1", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const link = extractLink($element.find("a"));
        const linkText = extractLinkText($element.find("a"), $);
        const linkTextStartPos = $element.text().indexOf(linkText);
        const prefix = $element.text().substring(0, linkTextStartPos).trim();
        const suffix = $element.text().substring(linkTextStartPos + linkText.length).trim();
        const convElement = {type: "cta", data: {link, linkText}}; // $SuppressFlowCheck
        if (prefix) convElement.prefix = prefix; // $SuppressFlowCheck
        if (suffix) convElement.suffix = suffix;
        assertExtractedData(link, linkText, $element);
        return {elements: [convElement]};
    }
}

export class CTAHandlerVariant_TabularData extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        return $e.hasClass("tabular-data") 
            && $e.find(" > h3.lt-pad-10").length == 1 
            && $e.find(" > div.col-md-7").length == 1 
            && $e.find(" > div.col-md-4").length == 1 && $e.find(" > div.col-md-4 > a").length == 1;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const link = extractLink($element.find("a")) || "";
        const linkText = extractLinkText($element.find("a"), $);
        const title = extractHeadingText($element.find("h3"), $);
        const prefix = extractContentHtml($element.find("> div.col-md-7"), $);
        assertExtractedData(link, linkText, $element);
        return {elements: [{type: "cta", data: {link, linkText, prefix, title}}]};
    }
}

export class CTAHandlerVariant_TabularDataSimple extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        return $e.hasClass("tabular-data") && isElementMadeUpOfOnlyWithGivenDescendents($e, ["h3", "a"], $);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const link = extractLink($element.find("a"));
        const linkText = extractLinkText($element.find("a"), $);
        assertExtractedData(link, linkText, $element);
        return {elements: [{type: "cta", data: {link, linkText}}]};
    }
}

export class CTAHandlerVariant_InsuranceWeekPick extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        return $e.hasClass("insurance-weekpick")
            && (
                ($e.children().length == 1 && $e.children().eq(0).hasClass("col-md-12")  && isElementMadeUpOfOnlyWithGivenDescendents($e, ["div", "a"], $))
                || ($e.children().length == 1 && isElementMadeUpOfOnlyWithGivenDescendents($e, ["a"], $))
            );
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const link = extractLink($element.find("a"));
        const linkText = extractLinkText($element.find("a"), $);
        assertExtractedData(link, linkText, $element);
        return {elements: [{type: "cta", data: {link, linkText}}]};
    }
}

export class CTAHandlerVariant_ListGroup_UL extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        return $e.get(0).tagName == "ul" && $e.hasClass("list-group") 
            && $e.children().length == 1 && $e.children().first().get(0).tagName == "li" 
            && $e.children().first().children().length == 1 && $e.children().first().children().first().get(0).tagName == "a"
            && Boolean($e.find(">li>a").attr("href"));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const link = extractLink($element.find("a"));
        const linkText = extractLinkText($element.find("a"), $);
        const prefix = $element.text().substring(0, $element.text().indexOf(linkText)).trim();
        assertExtractedData(link, linkText, $element);

        const convElement = {type: "cta", data: {link, linkText}};   // $SuppressFlowCheck:
        if (prefix) convElement.prefix = prefix;
        return {elements: [convElement]};
    }
}

export class CTAHandlerVariant_ListGroup_P extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        return $e.get(0).tagName == "p" && $e.hasClass("list-group-item") 
            && $e.children().length == 1 && $e.children().first().get(0).tagName == "a" 
            && Boolean($e.find(">a").attr("href"));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const link = extractLink($element.find("a"));
        const linkText = extractLinkText($element.find("a"), $);
        const prefix = $element.text().substring(0, $element.text().indexOf(linkText)).trim();
        assertExtractedData(link, linkText, $element);

        const convElement = {type: "cta", data: {link, linkText}};    // $SuppressFlowCheck:
        if (prefix) convElement.prefix = prefix;
        return {elements: [convElement]};
    }
}