// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractLinkText, assert, extractImgSrc, isElementMadeUpOfOnlyWithGivenDescendents, extractHeadingText } from "./Utils";


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
        return ["ul", "ol"].includes($e.get(0).tagName) && isElementMadeUpOfOnlyWithGivenDescendents($e, ["li", "a"], $) && areAllAnchorsOnlyLocalLinks($e);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        return extractLinks(elements[0], $);
    }
}

export class DeprecatedTOCHandlerVariant_TableOfULofLIofAsOnly extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const containsOnly2Cells = () => $e.find("td,th").length == 2;
        const lastCellMadeUpOfOnlyULofLIofA = () => {
            return isElementMadeUpOfOnlyWithGivenDescendents($e.find("td").last(), ["ul", "li", "a"], $)
                || isElementMadeUpOfOnlyWithGivenDescendents($e.find("td").last(), ["ol", "li", "a"], $);
        };
        return $e.hasClass("hungry-table") && containsOnly2Cells() && lastCellMadeUpOfOnlyULofLIofA() && areAllAnchorsOnlyLocalLinks($e);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        return extractLinks(elements[0], $);
    }
}

export class DeprecatedTOCHandlerVariant_TableOfAsOnly extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const containsOnly1Row = () => $e.find("tr").length == 1;
        const cellsMadeUpOfOnlyA = () => {
            return $e.find("th").get().every((th) => $(th).children().length == 1 && $(th).find("> a").length == 1);
        };
        return $e.hasClass("hungry-table") && containsOnly1Row() && cellsMadeUpOfOnlyA() && areAllAnchorsOnlyLocalLinks($e);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        return extractLinks(elements[0], $);
    }
}

export class DeprecatedTOCHandlerVariant_DivOfULOfLinks extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const nodeIsCntrOfLinks = ($e) => {
            if ($e.find("ul").get().every((ul) => isElementMadeUpOfOnlyWithGivenDescendents($(ul), ["li", "a"], $))) {
                return true;
            }
            return false;
        };
        return $e.get(0).tagName == "div" && $e.find("> ul").length > 0 && nodeIsCntrOfLinks($e)  && areAllAnchorsOnlyLocalLinks($e);
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
    const items = $e.find("a").map((i, link) => {
        const $link = $(link);
        const output = {linkText: extractLinkText($link, $, ["strong"]), link: $link.attr("href")};
        if ($link.find("img").length > 0) {
            // $SuppressFlowCheck
            output["img"] = {src: extractImgSrc($link.find("img"))};
        }
        return output;
    }).get();
    return {elements: [{type: "custom_toc", items}], issues: ["Deprecated TOC Used"]};
};