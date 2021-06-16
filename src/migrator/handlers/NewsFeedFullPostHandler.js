// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import { extractHeadingText, extractContentHtml, handleChildrenOfCompoundElements } from "./Utils";

export class NewsFeedFullPostHandlerVariant_Main extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        const itemIsAPost = ($item) => {
            return $item.hasClass("news-green")
                && $item.find("> .news-head").length == 1
                && $item.find("> p").length > 0
                && $item.find("> div.pull-right").length == 1
                && $item.find("> div.pull-right > p > img").length == 1;
        };
        return $e.hasClass("news-widget") 
            && $e.children().length == 2
            && $e.find("> div.bigtxt, > h2").length == 1
            && $e.find("> ul > li.news-green, > div > ul > li.news-green").length > 0
            && $e.find("> ul > li.news-green, > div > ul > li.news-green").get().every((item) => itemIsAPost($(item)));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = elements[0];
        const title = extractHeadingText($e.find("> div.bigtxt, > h2"), $);
        const items = $e.find("ul > li.news-green").map((i, item) => {
            const $titleElem = $(item).find(".news-head");
            const title = extractHeadingText($titleElem, $);
            const body = handleChildrenOfCompoundElements($($titleElem).nextUntil("div.pull-right"), $).targetElements;
            const updatedOn = computeISODateString($(item).find("div.pull-right p:last-child").text());
            return {title, article: body, updatedOn};
        }).get();
        return {elements: [{type: "news-feed-full-posts", title, items}]};
    }
}

export class NewsFeedFullPostHandlerVariant_Main2 extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        const itemIsAPost = ($item) => {
            return $item.find("> .news-head").length == 1
                && $item.find("> p").length > 0
                && $item.find("> div.pull-right").length == 1
                && $item.find("> div.pull-right > p > img").length == 1;
        };
        return $e.hasClass("news-widget") 
            && $e.children().length == 2
            && $e.find("> div.bigtxt").length == 1
            && $e.find("> div.col-sm-12").length > 0
            && $e.find("> div.col-sm-12").get().every((item) => itemIsAPost($(item)));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = elements[0];
        const title = extractHeadingText($e.find("> div.bigtxt, > h2, > h3"), $);
        const items = $e.find("ul > li.news-green").map((i, item) => {
            const $titleElem = $(item).find(".news-head");
            const title = extractHeadingText($titleElem, $);
            const body = handleChildrenOfCompoundElements($($titleElem).nextUntil("div.pull-right"), $).targetElements;
            const updatedOn = computeISODateString($(item).find("div.pull-right p:last-child, div.pull-right > em").text());
            return {title, article: body, updatedOn};
        }).get();
        return {elements: [{type: "news-feed-full-posts", title, items}]};
    }
}

export class NewsFeedFullPostHandlerVariant_Main3 extends NewsFeedFullPostHandlerVariant_Main2 {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        const itemIsAPost = ($item) => {
            return $item.find("> .news-head").length == 1
                && $item.find("> p").length > 0
                && $item.find("> div.pull-right").length == 1;
        };
        return $e.hasClass("news-widget") 
            && $e.children().length == 2
            && $e.find("> h2, > h3").length == 1
            && $e.find("> ul > li").length > 0
            && $e.find("> ul > li").get().every((item) => itemIsAPost($(item)));
    }
}

const computeISODateString = (v) => {
    const dateAsString = (v).replace(/st|nd|rd|th/, "").replace(/\s/g, "-") + " GMT+0530";
    return new Date(dateAsString).toISOString().substring(0,10);
}