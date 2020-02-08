// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import { extractHeadingText, extractLink, extractLinkText, isElementAHeadingNode, isElementATableNode, assert, isElementMadeUpOfOnlyWithGivenDescendents } from "./Utils";
import {containsOnlyGridCellClasses} from "./UnwrapHandler";

const assertExtractedData = (items, title, $e) => assert(items.length > 0 && items.every((item) => item.link && item.title) && Boolean(title), "ReferencesHandler-CannotExtractReferences", $e);

export const headingRegex = /related [a-z]* product|other [a-z]* product|other [a-z\s]* by|other products from|offered by other|read more/i;

export class ReferencesHandlerVariant_Nav extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        return $element.get(0).tagName == "nav";
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const title = extractHeadingText($element.find("h2,h3,h4,h5,h6,h7").eq(0), $);
        const items = $element.find("li > a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title, $element);
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_HeadingRegex extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        const allowedNextTagNames = ["table", "div", "ul"];
        const nextElementIsAppro = ($n) => allowedNextTagNames.includes($n.get(0).tagName) || isElementATableNode($n);
        return (isElementAHeadingNode($element) || $element.get(0).tagName == "strong") 
            && $element.text().match(headingRegex) && nextElementIsAppro($element.next());
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        return [$element, $element.next()];
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].find("a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title, elements[0]);
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_InterlinksOfAccordion extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        return $element.hasClass("product-interlinks") && $element.find(".twi-accordion").length > 0;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = elements[0].find(".panel-heading a").text();
        const items = elements[0].find(".panel-body a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title, elements[0]);
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_InterlinkOfStrongAndUL extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        return $element.hasClass("product_interlink") && $element.find(" > strong, > h3").length == 1 && $element.find(" > ul").length == 1;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0].find("> strong, > h3"), $);
        const items = elements[0].find("> ul a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title, elements[0]);
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_InterlinksOfNav extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        return $element.hasClass("product-interlinks") && $element.find("nav").length > 0;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0].find("nav h3"), $);
        const items = elements[0].find("nav a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title, elements[0]);
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_Accordion extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        return ($element.hasClass("ln-accordion") || $element.hasClass("twi-accordion") || $element.hasClass("panel"))
            && $element.find(".panel-title").text().match(headingRegex)
            && $element.find(".panel-body li").length > 0
            && $element.find(".panel-body li").length == $element.find(".panel-body li > a").length;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0].find(".panel-title a"), $);
        const items = elements[0].find(".panel-body a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title, elements[0]);
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_NewsWidget extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        return $element.hasClass("news-widget")
            && $element.find("h3.news-head").text().match(headingRegex)
            && $element.find("ul.insurer-widget > li").length > 0
            && $element.find("ul.insurer-widget > li").length == $element.find("ul.insurer-widget > li > a").length;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0].find("h3.news-head"), $);
        const items = elements[0].find("ul.insurer-widget > li > a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title, elements[0]);
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_GridOfAccordions extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const allChildrenAreAccordion = () => $e.children().get().every((c) => $(c).hasClass("twi-accordion"));
        const allPanelBodiesAreReferences = () => {
            const panelBodies = $e.find(".twi-accordion .panel-body").get();
            return panelBodies.length > 0 
                && panelBodies.every((c) => isElementMadeUpOfOnlyWithGivenDescendents($(c), ["ul", "li", "a"], $) 
                    || isElementMadeUpOfOnlyWithGivenDescendents($(c), ["ul", "ul", "li", "a"], $));
        };
        const allPanelHeadingsAreReferences = () => {
            const panelHeadings = $e.find(".twi-accordion .panel-heading").get();
            return panelHeadings.length > 0 
                && panelHeadings.every((panel) => {
                    const currPanelChildren = $(panel).children().get();
                    return currPanelChildren[0].tagName == "h2" && currPanelChildren.slice(1).every((c) => isElementMadeUpOfOnlyWithGivenDescendents($(c), ["li", "a"], $));
                });
        };
        return $e.hasClass("row") && allChildrenAreAccordion() && (allPanelBodiesAreReferences() || allPanelHeadingsAreReferences()) && areAllAnchorsOnlyNonLocalLinks($e.find(".twi-accordion .panel-body ul li a"));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const targetElements = elements[0].find(".twi-accordion").map((i, root) => {
            const title = extractHeadingText($(root).find("strong.panel-title a, .panel-heading h2 strong"));
            const items = $(root).find("ul li a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
            return {type: "references", title, items};
        }).get();
        return {elements: targetElements};
    }
}

export class ReferencesHandlerVariant_GridOfInterlink extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const allChildrenAreGridCells = () => $e.children().get().every((c) => containsOnlyGridCellClasses($(c).attr("class")));
        const allULsAreJustReferences = () => {
            const lists = $e.find("ul").get();
            return lists.length > 0 && lists.every((c) => isElementMadeUpOfOnlyWithGivenDescendents($(c), ["li", "a"], $));
        };
        return $e.hasClass("row") && allChildrenAreGridCells() && $e.find(".product_interlink").length > 0 && allULsAreJustReferences() && areAllAnchorsOnlyNonLocalLinks($e);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0].find("h3"), $);
        const items = elements[0].find("ul li a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_UsefulLinks extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        return $element.hasClass("useful-links") 
            && $element.children().length == 2
            && isElementAHeadingNode($element.children().eq(0))
            && ["ul", "ol"].includes($element.children().eq(1).get(0).tagName);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0].children().first(), $);
        const items = elements[0].find("ul > li > a").map((i, link) => ({link: $(link).attr("href"), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title, elements[0]);
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_HeadingRegexAndCntrOfLinks extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const nextNodeIsCntrOfLinks = ($n) => {
            if ($n.length == 0) {
                return false;
            }
            if (["ul", "ol"].includes($n.get(0).tagName) && isElementMadeUpOfOnlyWithGivenDescendents($n, ["li", "a"], $)) {
                return true;
            }
            if ($n.get(0).tagName == "div" && $n.hasClass("hungry-table") && isElementMadeUpOfOnlyWithGivenDescendents($n, ["table", "tbody", "tr", "td", "a"], $)) {
                return true;
            }
            return false;
        };
        return isElementAHeadingNode($e) && nextNodeIsCntrOfLinks($e.next()) && areAllAnchorsOnlyNonLocalLinks($e.next());
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


const areAllAnchorsOnlyNonLocalLinks = ($e) => {
    const links = $e.find("a").get();
    return links.every((link) => !link.attribs.href.startsWith("#"));
};
