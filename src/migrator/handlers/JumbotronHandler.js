// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractHeadingText, extractContentHtml, isElementAHeadingNode, assert} from "./Utils";

export class JumbotronHandlerVariant_Main extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType): boolean {
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
        assert(Boolean(body), "JumbotronHandler-CannotExtractBody", $element);
        return {elements: [{type: "panel", title, body}]};
    }
}

export class JumbotronHandlerVariant_PrimaryKeyDetails extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType): boolean {
        return $element.hasClass("primary-key-details");
    }

    validate($element: CheerioElemType, $: CheerioDocType): void {
        assert($element.children().length == 1, "JumbotronHandlerVariant_PrimaryKeyDetails-ConditionNotMet#1", $element);
        assert($element.find(" > p").length == 1, "JumbotronHandlerVariant_PrimaryKeyDetails-ConditionNotMet#2", $element);
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
        assert(Boolean(body), "JumbotronHandler-CannotExtractBody", $element);
        return {elements: [{type: "panel", title, body}], issues: ["PrimaryKeyDetails converted into Jumbotron"]};
    }
}