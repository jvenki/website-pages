// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {assert, extractLink, extractHeadingText, handleChildrenOfCompoundElements, extractImgSrc} from "./Utils";

export class FeaturedOffersHandlerVariant_BorderBlue extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
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
            const link = extractLink($titleBox.find("h5 > a"));
            const imgSrc = extractImgSrc($titleBox.find("img"));
            const body = handleChildrenOfCompoundElements($bodyBox, $).targetElements;
            assert(Boolean(title) && Boolean(imgSrc) && Boolean(body), "FeaturedOffersHandlerVariant_BorderBlue-ConditionNotMet#5", $offerElement);
            return {title, link, img: {src: imgSrc}, body};
        };
        const offers = elements.filter(($e) => $e.hasClass("border-blue")).map(($element) => extract($element));
        return {elements: [{type: "featured-offers", data: {offers}}]};
    }
}

export class FeaturedOffersHandlerVariant_BorderBlue_Variant1 extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return $e.get(0).tagName == "div" && $e.hasClass("border-blue") 
            && $e.find("p > strong").length > 0 && $e.find("img").length > 0;
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
            assert($element.find("p > strong").length == 1, "FeaturedOffersHandlerVariant_BorderBlue_Variant-ConditionNotMet#1", $element);
            assert($element.find("p > strong").children().length == 1, "FeaturedOffersHandlerVariant_BorderBlue_Variant-ConditionNotMet#2", $element);
            assert($element.find("img").length == 1, "FeaturedOffersHandlerVariant_BorderBlue_Variant-ConditionNotMet#3", $element);
            assert($element.find(" > div").length == 2, "FeaturedOffersHandlerVariant_BorderBlue_Variant-ConditionNotMet#4", $element);
        }
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const extract = ($offerElement) => {
            const $titleBox = $offerElement.children().eq(0);
            const $bodyBox = $titleBox.nextAll("div");
        
            const title = extractHeadingText($titleBox.find("p > strong"), $) || extractHeadingText($titleBox.find("p > strong"), $);
            const link = extractLink($titleBox.find("p > strong > a"));
            const imgSrc = extractImgSrc($titleBox.find("img"));
            const body = handleChildrenOfCompoundElements($bodyBox, $).targetElements;
            assert(Boolean(title) && Boolean(imgSrc) && Boolean(body), "FeaturedOffersHandlerVariant_BorderBlue-ConditionNotMet#5", $offerElement);
            return {title, link, img: {src: imgSrc}, body};
        };
        console.log("Converting featured offers")
        const offers = elements.filter(($e) => $e.hasClass("border-blue")).map(($element) => extract($element));
        return {elements: [{type: "featured-offers", data: {offers}}]};
    }
}


export class FeaturedOffersHandlerVariant_Template extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType) {
        return $e.get(0).tagName == "div" && $e.hasClass("col-md-12") && $e.hasClass("top-pad-10") 
            && ["h2", "h3"].includes($e.children().eq(0).get(0).tagName)
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
        assert($element.find("h2,h3").length == 1, "FeaturedOffersHandlerVariant_Template-ConditionNotMet#1", $element);
        assert($element.find("img").length == 1, "FeaturedOffersHandlerVariant_Template-ConditionNotMet#2", $element);
        assert($element.find(" > div").length == 2, "FeaturedOffersHandlerVariant_Template-ConditionNotMet#3", $element);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const extract = ($offerElement) => {
            const title = extractHeadingText($offerElement.find("h2,h3"), $);
            const imgSrc = extractImgSrc($offerElement.find("img"));
            let body = [];
            $offerElement.find("> div").eq(1).children().each((i, be) => {
                if (be.tagName == "h5" && $(be).text() == "Key Highlights") {
                    return;
                }
                body.push(...handleChildrenOfCompoundElements($(be), $).targetElements);
            });
            assert(Boolean(title) && Boolean(imgSrc) && Boolean(body), "FeaturedOffersHandlerVariant_Template-ConditionNotMet#4", $offerElement);
            return {title, img: {src: imgSrc}, body};
        };
        const offers = elements.map(($element) => extract($element));
        return {elements: [{type: "featured-offers", data: {offers}}]};
    }
}