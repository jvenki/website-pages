// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import { extractHeadingText, extractLink, extractLinkText, isElementAHeadingNode, isElementATableNode, assert, isElementMadeUpOfOnlyWithGivenDescendents } from "./Utils";
import {containsOnlyGridCellClasses} from "./UnwrapHandler";

const assertExtractedData = (items, title, $e) => assert(items.length > 0 && items.every((item) => item.link && item.title) && Boolean(title), "ReferencesHandler-CannotExtractReferences", $e);

export const headingRegex = /related [a-z]* product|other [a-z]* product|other [a-z\s]* by|other products from|offered by other|read more|read on/i;

const headingRegexMatches = ($element) => {
    const elemIsAppro = isElementAHeadingNode($element)
        || $element.get(0).tagName == "strong"
        || ($element.get(0).tagName == "p" && $element.children().length == 1 && $element.find (" > strong").length == 1);
    
    return elemIsAppro && $element.text().match(headingRegex);
};

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
        const nextElementIsAppro = ($n) => {
            return $n.length > 0 
                && (isElementATableNode($n) 
                    || ["ul", "ol"].includes($n.get(0).tagName)
                    || $n.get(0).tagName == "div" && $n.find(".twi-accordion").length == 0
                );
        };
        return headingRegexMatches($element) && nextElementIsAppro($element.next());
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

export class ReferencesHandlerVariant_ProductsInvest extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        if (!$element.hasClass("bb-products-invest")) {
            return false;
        }
        $("a.bbicons-fd").each((i, a) => {
            if (!$(a).attr("href") && $(a).next().get(0).tagName == "a") {
                $(a).remove();
            }
        });
        return areAllAnchorsOnlyNonLocalLinks($element);
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        assert($element.find("ul").length == 1 || $element.get(0).tagName == "ul", "ReferencesHandlerVariant_ProductsInvest-ConditionNotMet#1", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0].find(">p,>h3,>h4,>h5,>h6,>h7"), $);
        const items = elements[0].find("> ul > li > a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title || "NA", elements[0]);
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_HeadingRegex_Buggy extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return headingRegexMatches($e) && this._isElementAReference($e.next(), $);
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const elements = [$element];
        while (true) {
            $element = $element.next();
            if (!this._isElementAReference($element, $)) {
                break;
            }
            elements.push($element);
        }
        return elements;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements.slice(1).map(($e) => ({link: extractLink($($e.find("> a"))), title: extractLinkText($e, $)}));
        assertExtractedData(items, title, elements[0]);
        return {elements: [{type: "references", title, items}]};
    }

    _isElementAReference($n: CheerioElemType, $: CheerioDocType) {
        const buggyTagNames = ["p", "li"];
        return $n.length > 0 && buggyTagNames.includes($n.get(0).tagName) 
            && $n.children().length == 1 && $n.find("> a").length == 1
            && areAllAnchorsOnlyNonLocalLinks($n)
            && $n.find("a").get().every((a) => $(a).attr("href").indexOf("disclaimer") == -1);
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
        return $element.hasClass("product_interlink") 
            && $element.find("li a").length > 0
            && areAllAnchorsOnlyNonLocalLinks($element.find("li"));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $titleElem = elements[0].find("> strong, > h3, > h2");
        const targetElements = $titleElem.map((i, te) => {
            const title = extractHeadingText($(te), $);
            const items = $(te).nextUntil("strong, h3, h2").find("a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
            assertExtractedData(items, title || "NA", elements[0]);
            return {type: "references", title, items};
        }).get();
        return {elements: targetElements};
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
            // && $element.find(".panel-title").text().match(headingRegex)
            && isElementMadeUpOfOnlyWithGivenDescendents($element.find(".panel-body"), ["ul", "li", "a"], $)
            && areAllAnchorsOnlyNonLocalLinks($element.find(".panel-body"));
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
        return ($element.hasClass("news-widget") || $element.hasClass("news-widget-aside"))
            && $element.find(".news-head").length == 1
            && $element.find(".insurer-widget > li").length > 0
            && $element.find(".insurer-widget > li").length == $element.find(".insurer-widget > li > a").length
            && areAllAnchorsOnlyNonLocalLinks($element.find(".insurer-widget > li"));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0].find(".news-head"), $);
        const items = elements[0].find(".insurer-widget > li > a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
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
        return ($e.hasClass("row") || $e.hasClass("col-md-12"))
            && allChildrenAreAccordion() 
            && (allPanelBodiesAreReferences() || allPanelHeadingsAreReferences()) 
            && (areAllAnchorsOnlyNonLocalLinks($e.find(".twi-accordion .panel-body ul li")) || areAllAnchorsOnlyNonLocalLinks($e.find(".twi-accordion .panel-heading ul li")));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const targetElements = elements[0].find(".panel").map((i, root) => {
            const title = extractHeadingText($(root).find("strong.panel-title a, .panel-heading h2 strong"), $);
            const items = $(root).find("ul li a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
            return {type: "references", title, items};
        }).get();
        return {elements: targetElements};
    }
}

export class ReferencesHandlerVariant_GridOfInterlink extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const allChildrenAreGridCells = () => $e.children().get().every((c) => containsOnlyGridCellClasses($(c).attr("class")));
        const allCellsAreRefCntrs = () => $e.children().get().every((cell) => {
            if ($(cell).find(".product_interlink").length == 1) {
                cell = $(cell).find(".product_interlink");
            }
            let check = false;
            if ($(cell).children().length == 1) {
                check = ["ul"].includes($(cell).children().eq(0).get(0).tagName);
            } else if ($(cell).children().length == 2) {
                check = ["h3"].includes($(cell).children().eq(0).get(0).tagName) && ["ul", "ol"].includes($(cell).children().eq(1).get(0).tagName);
            }
            return check;
        });
        const allULsAreJustReferences = () => {
            const lists = $e.find("ul").get();
            return lists.length > 0 && lists.every((c) => isElementMadeUpOfOnlyWithGivenDescendents($(c), ["li", "a"], $));
        };

        return $e.hasClass("row") && $e.find(".product_interlink").length > 0 
            && allChildrenAreGridCells() && allCellsAreRefCntrs() 
            && allULsAreJustReferences() && areAllAnchorsOnlyNonLocalLinks($e);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const targetElements = [];
        elements[0].find("div > ul").each((i, ul) => {
            const hasTitleElem = $(ul).prev().length > 0 && ["h3"].includes($(ul).prev().get(0).tagName);
            const items = $(ul).find(" > li > a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
            if (hasTitleElem) {
                const title = extractHeadingText($(ul).prev(), $);
                targetElements.push({type: "references", title, items});
            } else {
                if (targetElements.length > 0) {
                    targetElements[targetElements.length-1].items.push(...items);
                } else {
                    targetElements.push({type: "references", items});
                }
            }
        });

        return {elements: targetElements};
    }
}

export class ReferencesHandlerVariant_GridOfULs extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const allChildrenAreGridCells = () => {
            const startIndex = isElementAHeadingNode($e.children().eq(0)) ? 1 : 0;
            return $e.children().get().slice(startIndex).every((c) => containsOnlyGridCellClasses($(c).attr("class")));
        };
        const allCellsAreRefCntrs = () => {
            const startIndex = isElementAHeadingNode($e.children().eq(0)) ? 1 : 0;
            return $e.children().get().slice(startIndex).every((cell) => {
                let check = false;
                if ($(cell).children().length == 1) {
                    check = ["ul"].includes($(cell).children().eq(0).get(0).tagName);
                } else if ($(cell).children().length == 2) {
                    check = ["h3"].includes($(cell).children().eq(0).get(0).tagName) && ["ul", "ol"].includes($(cell).children().eq(1).get(0).tagName);
                }
                return check;
            });            
        };
        const allULsAreJustReferences = () => {
            const lists = $e.find("ul").get();
            return lists.length > 0 && lists.every((c) => isElementMadeUpOfOnlyWithGivenDescendents($(c), ["li", "a"], $));
        };

        return ($e.hasClass("row") || $e.hasClass("col-md-12"))
            && allChildrenAreGridCells() && allCellsAreRefCntrs() 
            && allULsAreJustReferences() && areAllAnchorsOnlyNonLocalLinks($e);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const targetElements = [];
        elements[0].find("div > ul").each((i, ul) => {
            const hasTitleElem = $(ul).prev().length > 0 && ["h3"].includes($(ul).prev().get(0).tagName);
            const items = $(ul).find(" > li > a").map((i, link) => ({link: extractLink($(link)), title: extractLinkText($(link), $)})).get();
            if (hasTitleElem) {
                const title = extractHeadingText($(ul).prev(), $);
                targetElements.push({type: "references", title, items});
            } else {
                if (targetElements.length > 0) {
                    targetElements[targetElements.length-1].items.push(...items);
                } else {
                    let title;
                    if (elements[0].find(">h3").length > 0) {
                        title = extractHeadingText(elements[0].find(">h3"), $);
                    }
                    targetElements.push({type: "references", title, items});
                }
            }
        });

        return {elements: targetElements};
    }
}

export class ReferencesHandlerVariant_UsefulLinks extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        return $element.hasClass("useful-links");
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        const isLinksCntrValid = ($n) => {
            return (
                ["ul", "ol"].includes($n.get(0).tagName)
                || ($n.hasClass("useful-links") && $n.children().length == 1 && ["ul", "ol"].includes($n.children().eq(0).get(0).tagName))
            );
        };

        assert($element.children().length <= 2, "UsefulLinks-More than 2 Children Found", $element);
        if ($element.children().length == 1) {
            assert(isLinksCntrValid($element.children().eq(0)), "UsefulLinks-Links Cntr is not proper", $element);
        } else {
            assert(isElementAHeadingNode($element.children().eq(0)), "UsefulLinks-Heading is not proper", $element);
            assert(isLinksCntrValid($element.children().eq(1)), "UsefulLinks-Links Cntr is not proper", $element);
        }
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = elements[0];
        let title;
        if ($e.children().length == 2) {
            title = extractHeadingText(elements[0].children().first(), $);
        }
        const items = elements[0].find("ul > li > a").map((i, link) => ({link: $(link).attr("href"), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title || "NA", elements[0]);
        return {elements: [{type: "references", title: title || "Useful Links", items}]};
    }
}

export class ReferencesHandlerVariant_HeadingRegexAndCntrOfLinks extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return isElementAHeadingNode($e) && isElementACntrOfExternalLinks($e.next(), $);
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

export class ReferencesHandlerVariant_TableOfLinks extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return isElementACntrOfExternalLinks($e, $, ["table"]);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0].find("th"), $);
        const items = elements[0].find("a").map((i, link) => ({link: $(link).attr("href"), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title || "NA", elements[0]);
        return {elements: [{type: "references", title, items}]};
    }
}

const areAllAnchorsOnlyNonLocalLinks = ($e) => {
    const links = $e.find("a").get();
    return links.length > 0 && links.every((link) => link.attribs.href && !link.attribs.href.startsWith("#"));
};

export const isElementACntrOfExternalLinks = ($e: CheerioElemType, $: CheerioDocType, restrictTo: ?Array<string>) => {
    const elemIsTableOfLinks = ($e) => {
        if ($e.find("th").length > 0 && !$e.find("th").text().match(headingRegex)) {
            return false;
        }
        if ($e.find("td").get().filter((td) => Boolean($(td).text().trim())).every((td) => isElementMadeUpOfOnlyWithGivenDescendents($(td), ["a"], $))) {
            return areAllAnchorsOnlyNonLocalLinks($e);
        }
        return false;
    };
    const elemIsListOfLinks = ($e) => {
        if (isElementMadeUpOfOnlyWithGivenDescendents($e, ["li", "a"], $)) {
            return areAllAnchorsOnlyNonLocalLinks($e);
        }
        return false;
    };

    if ($e.length == 0) {
        return false;
    } else if ((!restrictTo || restrictTo.includes("table")) && isElementATableNode($e)) {
        return elemIsTableOfLinks($e);
    } else if ((!restrictTo || restrictTo.includes("list")) && ["ul", "ol"].includes($e.get(0).tagName)) {
        return elemIsListOfLinks($e);
    }
    return false;
};