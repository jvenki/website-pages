// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractLinkText, assert, extractImgSrc, isElementMadeUpOfOnlyWithGivenDescendents } from "./Utils";


export class DeprecatedTOCHandlerVariant_ProductsInvest extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        return $element.hasClass("bb-products-invest")  ;
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        assert($element.find("ul").length == 1 || $element.get(0).tagName == "ul", "DeprecatedTOCHandlerVariant_ProductsInvest-ConditionNotMet#1", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        return extractLinks(elements[0], $);
    }
}

export class DeprecatedTOCHandlerVariant_ULofAsOnly extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return ["ul", "ol"].includes($e.get(0).tagName) && isElementMadeUpOfOnlyWithGivenDescendents($e, ["li", "a"]) && areAllAnchorsOnlyLocalLinks($e);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        return extractLinks(elements[0], $);
    }
}

const areAllAnchorsOnlyLocalLinks = ($e) => {
    const links = $e.find("a").get();
    return links.every((link) => link.attribs.href.startsWith("#"));
};

const extractLinks = ($e, $) => {
    const items = $e.find("li > a").map((i, link) => {
        const $link = $(link);
        const output = {linkText: extractLinkText($link, $), link: $link.attr("href")};
        if ($link.find("img").length > 0) {
            // $SuppressFlowCheck
            output["img"] = {src: extractImgSrc($link.find("img"))};
        }
        return output;
    }).get();
    return {elements: [{type: "custom_toc", items}], issues: ["Deprecated TOC Used"]};
};