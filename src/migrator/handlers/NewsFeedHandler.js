// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import { extractLinkText, extractImgSrc, extractHeadingText } from "./Utils";

export class NewsFeedHandlerVariant_Main extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        return $e.hasClass("news-widget") 
            && $e.children().length == 1 
            && $e.find("> ul > li > h2").length == 1
            && $e.find("> ul > li > div.lp-blog-post").length == 1
            && $e.find("> ul > li > div.lp-blog-post > ul").length == 1
            && $e.find("> ul > li > div.lp-blog-post > ul > li > a").length > 0;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = elements[0];
        const title = extractHeadingText($e.find("h2.news-head"), $);
        const items = $e.find("div.lp-blog-post > ul > li > a").map((i, a) => {
            const title = extractLinkText($(a).find("p"), $);
            const link = $(a).attr("href");
            const imgSrc = extractImgSrc($(a).find("img"));
            return {title, link, img: {src: imgSrc}};
        }).get();
        return {elements: [{type: "news-feed", title, items}]};
    }
}

export class NewsFeedHandlerVariant_Main2 extends NewsFeedHandlerVariant_Main {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        return $e.hasClass("news-widget") 
            && $e.children().length == 3 
            && $e.find("> h2").length == 1
            && $e.find("> div.lp-blog-post").length == 1
            && $e.find("> div.lp-blog-get-app").length == 1
            && $e.find("> div.lp-blog-post > ul").length == 1
            && $e.find("> div.lp-blog-post > ul > li > a").length > 0;
    }
}
