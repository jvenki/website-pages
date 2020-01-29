// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import { extractHeadingText, extractLinkText, isElementAHeadingNode, isElementATableNode, assert } from "./Utils";
import { ConversionIssueCode } from "../MigrationError";

const assertExtractedData = (items, title, $e) => assert(items.length > 0 && items.every((item) => item.link && item.title) && Boolean(title), ConversionIssueCode.EMPTY_ELEMENT, $e);

export const headingRegex = /related [a-z]* product|other [a-z]* product/i;

export class ReferencesHandlerVariant_Nav extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType) {
        return $element.get(0).tagName == "nav";
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const title = extractHeadingText($element.find("h2,h3,h4,h5,h6,h7").eq(0), $);
        const items = $element.find("li > a").map((i, link) => ({link: $(link).attr("href"), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title, $element);
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_HeadingRegex extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType) {
        const allowedNextTagNames = ["table"];
        const nextElementIsAppro = ($n) => allowedNextTagNames.includes($n.get(0).tagName) || isElementATableNode($n);
        return isElementAHeadingNode($element) && $element.text().match(headingRegex) && nextElementIsAppro($element.next());
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        return [$element, $element.next()];
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].find("a").map((i, link) => ({link: $(link).attr("href"), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title, elements[0]);
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_InterlinksOfAccordion extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType) {
        return $element.hasClass("product-interlinks") && $element.find(".twi-accordion").length > 0;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = elements[0].find(".panel-heading a").text();
        const items = elements[0].find(".panel-body a").map((i, link) => ({link: $(link).attr("href"), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title, elements[0]);
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_InterlinksOfNav extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType) {
        return $element.hasClass("product-interlinks") && $element.find("nav").length > 0;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0].find("nav h3"), $);
        const items = elements[0].find("nav a").map((i, link) => ({link: $(link).attr("href"), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title, elements[0]);
        return {elements: [{type: "references", title, items}]};
    }
}