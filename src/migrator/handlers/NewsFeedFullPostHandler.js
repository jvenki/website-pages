// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import { extractHeadingText, extractContentHtml } from "./Utils";

export class NewsFeedFullPostHandlerVariant_Main extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        const itemIsAPost = ($item) => {
            return $item.hasClass("news-green")
                && $item.find("> h2").length == 1
                && $item.find("> p").length > 0
                && $item.find("> div.pull-right").length == 1
                && $item.find("> div.pull-right > p > img").length == 1;
        };
        return $e.hasClass("news-widget") 
            && $e.children().length == 2
            && $e.find("> div.bigtxt").length == 1
            && $e.find("> ul > li.news-green").length > 0
            && $e.find("> ul > li.news-green").get().every((item) => itemIsAPost($(item)));
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = elements[0];
        const title = extractHeadingText($e.find("> div.bigtxt"), $);
        const items = $e.find("> ul > li.news-green").map((i, item) => {
            const $titleElem = $(item).find("h2.news-head");
            const title = extractHeadingText($titleElem, $);
            const body = $($titleElem).nextUntil("div.pull-right").map((j, b) => extractContentHtml($(b), $)).get().join(" ");
            const postedOn = computeISODateString($(item).find("div.pull-right p:last-child").text());
            return {title, body, postedOn};
        }).get();
        return {elements: [{type: "news-feed-full-posts", title, items}]};
    }
}

const computeISODateString = (v) => new Date(v.replace(/st|nd|rd|th/, "").replace(/\s/, "-") + " 05:30:00").toISOString().substring(0, 10);