// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractHeadingText, extractContentHtml, handleChildrenOfCompoundElements, isElementAHeadingNode, assert} from "./Utils";
import {isElementACntrOfExternalLinks} from "./ReferencesHandler";

export class JumbotronHandlerVariant_Main extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType): boolean {
        return $element.hasClass("jumbotron");
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        let title;
        if (isElementAHeadingNode($element.children().eq(0))) {
            title = extractHeadingText($element.children().eq(0), $);
        }
        const items = handleChildrenOfCompoundElements($element.children().slice(title ? 1 : 0), $).targetElements;
        assert(Boolean(items.length>0), "JumbotronHandlerVariant_Main-CannotExtractBody", $element);
        return {elements: [{type: "jumbotron", data: {title, elements: items}}]};
    }
}

export class JumbotronHandlerVariant_PrimaryKeyDetails_SingleP extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType): boolean {
        return $element.hasClass("primary-key-details") && $element.contents().length == 1;
    }

    validate($element: CheerioElemType, $: CheerioDocType): void {
        assert($element.children().length == 1, "JumbotronHandlerVariant_PrimaryKeyDetails-ConditionNotMet#1", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        let title;
        let childElements = [];
        $element.find(" > p").contents().each((i, c) => {
            if (!title && c.tagName == "strong") {
                title = extractHeadingText($(c), $).replace(/:$/, "");
            } else {
                childElements.push(...handleChildrenOfCompoundElements([$(c)], $).targetElements);
            }
        });
        assert(Boolean(childElements.length>0), "JumbotronHandlerVariant_PrimaryKeyDetails_P-CannotExtractBody", $element);
        return {elements: [{type: "jumbotron", data: {title, elements: childElements}}], issues: ["PrimaryKeyDetails converted into Jumbotron"]};
    }
}

export class JumbotronHandlerVariant_PrimaryKeyDetails_HeadingAndPs extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType): boolean {
        return $element.hasClass("primary-key-details") && $element.contents().length != 1;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        let title;
        let childElements = [];
        $element.children().each((i, c) => {
            if (!title && (isElementAHeadingNode($(c), $) || c.tagName == "strong")) {
                title = extractHeadingText($(c), $);
            } else {
                childElements.push(...handleChildrenOfCompoundElements([$(c)], $).targetElements);
            }
        });
        assert(Boolean(childElements.length>0), "JumbotronHandlerVariant_PrimaryKeyDetails_H3AndPs-CannotExtractBody", $element);
        return {elements: [{type: "jumbotron", data: {title, elements: childElements}}], issues: ["PrimaryKeyDetails converted into Jumbotron"]};
    }
}

export class JumbotronHandlerVariant_InsuranceWeek extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType): boolean {
        return $element.hasClass("insurance-weekpick") && $element.find("> ul").length == 1 && $element.find("> ul > li").length == 1;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const $titleElem = $element.find("> ul > li > h3:first-child");
        const title = extractHeadingText($titleElem, $);
        const body = handleChildrenOfCompoundElements($titleElem.nextAll(), $).targetElements;
        assert(Boolean(body), "JumbotronHandlerVariant_InsuranceWeek-CannotExtractBody", $element);
        return {elements: [{type: "jumbotron", data: {title, elements: body}}], issues: ["NewsWeek converted into Jumbotron"]};
    }    
}

export class JumbotronHandlerVariant_LpRelatedInfo extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        return ($e.hasClass("news-widget") && $e.find("div.lp-related-info").length == 1 || $e.hasClass("lp-related-info")) 
            && $e.find("h3.lp-related-head").length == 1 
            && (!["ul", "ol"].includes($e.find(".lp-related-head").next().get(0).tagName) || !isElementACntrOfExternalLinks($e.find(".lp-related-head").next(), $));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const title = extractHeadingText($element.find("h3.lp-related-head"), $);
        const body = handleChildrenOfCompoundElements($element.find("h3.lp-related-head").nextAll(), $).targetElements;
        assert(Boolean(body), "JumbotronHandlerVariant_LpRelatedInfo-CannotExtractBody", $element);
        return {elements: [{type: "jumbotron", data: {title, elements: body}}], issues: ["LpRelatedInfo converted into Jumbotron"]};
    }    
}