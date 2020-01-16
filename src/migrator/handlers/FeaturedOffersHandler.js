// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {assert, extractHeadingText, extractContentHtml, extractImgSrc} from "./Utils";
import { ConversionIssueCode } from "../MigrationError";

export class FeaturedOffersHandlerVariant_BorderBlue extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        return $e.get(0).tagName == "div" && $e.hasClass("border-blue") 
            && $e.find("h5").length > 0 && $e.find("img").length > 0;
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const elements = [$element];
        let $currElem = $element;
        while (true) {
            const $nextElement = $currElem.next();
            if ($nextElement.length == 0) {
                break;
            }
            if (!$nextElement.hasClass("border-blue") && !$nextElement.hasClass("product-landing-btn-block")) {
                break;
            }
            elements.push($nextElement);
            $currElem = $nextElement;
        }
        return elements;
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        if ($element.hasClass("border-blue")) {
            assert($element.find("h5").length == 1, "FeaturedOffersHandlerVariant_BorderBlue-ConditionNotMet#1", $element);
            assert($element.find("h5").children().length == 1, "FeaturedOffersHandlerVariant_BorderBlue-ConditionNotMet#2", $element);
            assert($element.find("img").length == 1, "FeaturedOffersHandlerVariant_BorderBlue-ConditionNotMet#3", $element);
            assert($element.find(" > div").length == 2, "FeaturedOffersHandlerVariant_BorderBlue-ConditionNotMet#4", $element);
        }
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const extract = ($offerElement) => {
            const $titleBox = $offerElement.children().eq(0);
            const $bodyBox = $titleBox.nextAll("div");
        
            const title = extractHeadingText($titleBox.find("h5 > a"), $) || extractHeadingText($titleBox.find("h5"), $);
            const link = $titleBox.find("h5 > a").attr("href");
            const imgSrc = extractImgSrc($titleBox.find("img"));
            const body = extractContentHtml($bodyBox, $);
            assert(Boolean(title) && Boolean(imgSrc) && Boolean(body), ConversionIssueCode.EMPTY_ELEMENT, $offerElement);
            return {title, link, img: {src: imgSrc}, body};
        };
        const offers = elements.filter(($e) => $e.hasClass("border-blue")).map(($element) => extract($element));
        return {elements: [{type: "featured-offers", offers}]};
    }
}
