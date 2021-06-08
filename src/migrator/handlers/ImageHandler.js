// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {isElementMadeUpOfOnlyWithGivenDescendents, extractContentHtml, removeBGClasses, removeBorderClasses, removePositioningClass, removePaddingClass, extractLink, extractImgSrc, assert} from "./Utils";
import MigrationError, { ConversionIssueCode, CleanserIssueCode } from "../MigrationError";
import { containsOnlyGridCellClasses } from "./UnwrapHandler";

const assertExtractedData = (imgSrc, $e) => assert(Boolean(imgSrc), "InfographicHandler-ConditionNotMet#1", $e);


export class ImageHandler extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return (isDivMadeUpOfAofIMG($e, $) || isDivMadeUpOfIMG($e, $));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = $(elements[0]);
        const imgSrc = extractImgSrc($e.find("img"));
        const title = $e.find("img").attr("title") || $e.find("img").attr("alt");
        const alt = $e.find("img").attr("alt");
        const link = $e[0].tagName == "a" ? extractLink($e) : $e.find("a") ? extractLink($e.find("a")) : null;
        const actualElement = {type: "image", data: {src: imgSrc, title, link, alt}};
        return {elements: [actualElement]};
    }
}
export class ImageHandler_RootVariant extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return ($e.get(0).tagName == "img" || $e.tagName == "img");
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = $(elements[0]);
        const imgSrc = extractImgSrc($e);
        const title = $e.attr("title") || $e.attr("alt");
        const alt = $e.attr("alt");
        const link = $e[0].tagName == "a" ? extractLink($e) : $e.find("a") ? extractLink($e.find("a")) : null;
        const actualElement = {type: "image", data: {src: imgSrc, title, link, alt}};
        return {elements: [actualElement]};
    }
}
export class ImageHandlerVariant_Float extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return (isDivPulledRight($e, $) || isFigurePulledRight($e, $)) && (isDivMadeUpOfAofIMG($e, $) || isDivMadeUpOfIMG($e, $));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = $(elements[0]);
        const imgSrc = extractImgSrc($e.find("img"));
        const title = $e.find("img").attr("title") || $e.find("img").attr("alt");
        const alt = $e.find("img").attr("alt");
        const link = $e.find("a") ? extractLink($e.find("a")) || "" : "";
        const actualElement = {type: "image", data: {src: imgSrc, title, link, alt, float: "right"} };
        return {elements: [{type: "float", actualElement}]};
    }
}

export class ImageHandlerVariant_FloatInfographic extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        const isInfographic = () => $e.find(">a").attr("data-toggle") == "modal" && $(".bs-example-modal-lg").length > 0;
        return isDivPulledRight($e, $) && isDivMadeUpOfAofIMG($e, $) && isInfographic();
    }

    walkToPullRelatedElements($e: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const elements = [$e];
        if ($(".bs-example-modal-lg").length == 1) {
            elements.push($(".bs-example-modal-lg"));
        } else if ($e.next().hasClass("bs-example-modal-lg")) {
            elements.push($e.next());
        } else {
            throw new MigrationError(ConversionIssueCode.VALIDATION_FAILED_W3C, "Missing Modal Window", $e.toString());
        }
        return elements;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = elements[0];
        const imgSrc = extractImgSrc($e.find("img"));
        const imgSrcXL = extractImgSrc(elements[1].find("div.modal-body img"));
        const title = $e.find("img").attr("title") || $e.find("img").attr("alt");
        assertExtractedData(imgSrc, $e);
        const actualElement = {type: "image", data: {src: imgSrc, srcXL: imgSrcXL, title, float: "right"} };
        return {elements: [{type: "float", actualElement}]};
    }
}

const isDivPulledRight = ($e, $) => {
    const classNames = removeBGClasses(removeBorderClasses(removePositioningClass(removePaddingClass($e.attr("class")))));
    return $e.get(0).tagName == "div" && $e.hasClass("pull-right") && (!classNames || containsOnlyGridCellClasses(classNames));
};
const isFigurePulledRight = ($e, $) => $e.get(0).tagName == "figure" && $e.hasClass("pull-right");
const isDivMadeUpOfAofIMG = ($e, $) => isElementMadeUpOfOnlyWithGivenDescendents($e, ["a", "img"], $);
const isDivMadeUpOfIMG = ($e, $) => isElementMadeUpOfOnlyWithGivenDescendents($e, ["img"], $);
