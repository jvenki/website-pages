// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractLink, extractLinkText} from "./Utils";

export class SitemapHandler_Link extends BaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType, $: CheerioDocType): boolean {
        const link = $e.find("a").attr("href");
        return $e.children().length == 1 && $e.find(">a").length == 1 && link && link.match(/-sitemap\.html/);
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const link = extractLink($element.find("a"));
        if (!link) {
            return {elements: [], issues: ["Found a Sitemap without HREF. Ignoring it"]};
        }
        const linkText = extractLinkText($element, $);
        return {elements: [{type: "sitemap", link, linkText}]};
    }
}