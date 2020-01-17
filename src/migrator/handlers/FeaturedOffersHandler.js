// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {assert, extractHeadingText, extractContentHtml, extractImgSrc} from "./Utils";

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
            if (!$nextElement.hasClass("border-blue")) {
                break;    
            }
            elements.push($nextElement);
            $currElem = $nextElement;
        }
        return elements;
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        assert($element.find("h5").length == 1, "FeaturedOffersHandlerVariant_BorderBlue-ConditionNotMet#1", $element);
        assert($element.find("h5").children().length == 1, "FeaturedOffersHandlerVariant_BorderBlue-ConditionNotMet#2", $element);
        assert($element.find("img").length == 1, "FeaturedOffersHandlerVariant_BorderBlue-ConditionNotMet#3", $element);
        assert($element.find(" > div").length == 2, "FeaturedOffersHandlerVariant_BorderBlue-ConditionNotMet#4", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const extract = ($offerElement) => {
            const $titleBox = $offerElement.children().eq(0);
            const $bodyBox = $titleBox.nextAll("div");
        
            const title = extractHeadingText($titleBox.find("h5 > a"), $) || extractHeadingText($titleBox.find("h5"), $);
            const link = $titleBox.find("h5 > a").attr("href");
            const imgSrc = extractImgSrc($titleBox.find("img"));
            const body = extractContentHtml($bodyBox, $);
            return {title, link, img: {src: imgSrc}, body};
        };
        const offers = elements.map(($element) => extract($element));
        return {elements: [{type: "featured-offers", offers}]};
    }
}


export class FeaturedOffersHandlerVariant_Template extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        return $e.get(0).tagName == "div" && $e.hasClass("col-md-12") && $e.hasClass("top-pad-10") 
            && $e.children().eq(0).get(0).tagName == "h2"
            && $e.find("img").length > 0;
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const elements = [$element];
        let $currElem = $element;
        while (true) {
            const $nextElement = $currElem.next();
            if ($nextElement.length == 0) {
                break;
            }
            if (!$nextElement.hasClass("col-md-12") || !$nextElement.hasClass("top-pad-10")) {
                break;    
            }
            elements.push($nextElement);
            $currElem = $nextElement;
        }
        return elements;
    }

    validate($element: CheerioElemType, $: CheerioDocType) {
        assert($element.find("h2").length == 1, "FeaturedOffersHandlerVariant_Template-ConditionNotMet#1", $element);
        assert($element.find("img").length == 1, "FeaturedOffersHandlerVariant_Template-ConditionNotMet#2", $element);
        assert($element.find(" > div").length == 2, "FeaturedOffersHandlerVariant_Template-ConditionNotMet#3", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const extract = ($offerElement) => {
            const title = extractHeadingText($offerElement.find("h2"), $);
            const imgSrc = extractImgSrc($offerElement.find("img"));
            let body = "";
            $offerElement.find("> div").eq(1).children().each((i, be) => {
                if (be.tagName == "h5" && $(be).text() == "Key Highlights") {
                    return;
                }
                body += extractContentHtml($(be), $);
            });
            return {title, img: {src: imgSrc}, body};
        };
        const offers = elements.map(($element) => extract($element));
        return {elements: [{type: "featured-offers", offers}]};
    }
}