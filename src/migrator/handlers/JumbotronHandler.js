// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractHeadingText, extractContentHtml, isElementAHeadingNode, assert} from "./Utils";

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
        const items = $element.children().slice(title ? 1 : 0).map((i, e) => extractContentHtml($(e), $));
        const body = items.get().join("");
        assert(Boolean(body), "JumbotronHandlerVariant_Main-CannotExtractBody", $element);
        return {elements: [{type: "panel", title, body}]};
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
        let body = "";
        $element.find(" > p").contents().each((i, c) => {
            if (!title && c.tagName == "strong") {
                title = extractHeadingText($(c), $).replace(/:$/, "");
            } else {
                body += extractContentHtml($(c), $) + " ";
            }
        });
        assert(Boolean(body), "JumbotronHandlerVariant_PrimaryKeyDetails_P-CannotExtractBody", $element);
        return {elements: [{type: "panel", title, body}], issues: ["PrimaryKeyDetails converted into Jumbotron"]};
    }
}

export class JumbotronHandlerVariant_PrimaryKeyDetails_HeadingAndPs extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType): boolean {
        return $element.hasClass("primary-key-details") && $element.contents().length != 1;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        let title;
        let body = "";
        $element.children().each((i, c) => {
            if (!title && (isElementAHeadingNode($(c), $) || c.tagName == "strong")) {
                title = extractHeadingText($(c), $);
            } else {
                body += extractContentHtml($(c), $) + " ";
            }
        });
        assert(Boolean(body), "JumbotronHandlerVariant_PrimaryKeyDetails_H3AndPs-CannotExtractBody", $element);
        return {elements: [{type: "panel", title, body}], issues: ["PrimaryKeyDetails converted into Jumbotron"]};
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
        const body = $titleElem.nextAll().map((i, c) => extractContentHtml($(c), $)).get().join(" ");
        assert(Boolean(body), "JumbotronHandlerVariant_InsuranceWeek-CannotExtractBody", $element);
        return {elements: [{type: "panel", title, body}], issues: ["NewsWeek converted into Jumbotron"]};
    }    
}

export class JumbotronHandlerVariant_LpRelatedInfo extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        return ($e.hasClass("news-widget") && $e.find("div.lp-related-info").length == 1 || $e.hasClass("lp-related-info")) && $e.find("h3.lp-related-head").length == 1;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const title = extractHeadingText($element.find("h3.lp-related-head"), $);
        const body = $element.find("h3.lp-related-head").nextAll().map((i, c) => extractContentHtml($(c), $)).get().join(" ");
        assert(Boolean(body), "JumbotronHandlerVariant_LpRelatedInfo-CannotExtractBody", $element);
        return {elements: [{type: "panel", title, body}], issues: ["LpRelatedInfo converted into Jumbotron"]};
    }    
}