// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractImgSrc, extractLink, extractLinkText, assert} from "./Utils";

export class LandingBannerHandlerVariant_Main extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        return $e.hasClass("bb-landing-banner");
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];

        const $imgElem = $element.find("div.column-left > img");
        const imgSrc = extractImgSrc($imgElem);
        const imgTitle = $imgElem.attr("title") || $imgElem.attr("alt");

        const $linkElem = $element.find("div.cta-btn > a");
        const link = extractLink($linkElem);
        const linkText = extractLinkText($linkElem, $);

        const $itemsElem = $element.find("div.column-right > ul");
        const items = $itemsElem.find("> li").map((i, li) => {
            const $li = $(li);
            ensureItemIsAsPerSpec($li);
            return {text: $li.find(".desc").text(), icon: $li.find("span:first-child").attr("class").replace(/simplified-landing-banner-icons/, "").trim()};
        }).get();

        return {elements: [{type: "landing-banner", link, linkText, img: {src: imgSrc, title: imgTitle}, items}]};
    }
    
}

export class LandingBannerHandlerVariant_Simplified extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        return $e.hasClass("simplified-banner");
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];

        const imgSrc = "images/common/sm-li-simplified-banner.png";
        const items = $element.find(" > div.benefits > div").map((i, item) => {
            const $item = $(item);
            return {text: $item.find(".desc").text(), icon: $item.find("span:first-child").attr("class").replace(/simplified-banner-icons/, "").trim()};
        }).get();

        return {elements: [{type: "landing-banner", img: {src: imgSrc}, items}]};
    }
    
}

const ensureItemIsAsPerSpec = ($item) => {
    assert($item.children().length == 2, "LandingBanner - Item doesnt have 2 children", $item.toString());
    assert($item.children().eq(0).hasClass("simplified-landing-banner-icons"), "LandingBanner - Item Icon not right", $item.toString());
    assert($item.children().eq(1).hasClass("desc"), "LandingBanner - Icon Text not right", $item.toString());
    assert($item.children().eq(1).children().length == 0, "LandingBanner - Icon Text has children", $item.toString());
};