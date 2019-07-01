const BaseConverter = require("./BaseConverter");
const {computeColumnCount, assert, extractContentHtml, extractImgSrc} = require("./Utils");

class FeaturedNewsConverter extends BaseConverter {
    _doPreValidate($element, $, walker) {
        assert($element.find(" > ul > li").length == 1, "FeaturedNewsConverter condition not met #1");
    }

    _doConvert($element, $, walker) {
        const title = $element.find("h2").text();
        const columnCount = computeColumnCount($element.find("div.lp-blog-post > ul > li").first());
        const items = $element.find("div.lp-blog-post > ul > li").map((i, panel) => {
            const link = $(panel).find("a").attr("href");
            const imgSrc = extractImgSrc($(panel).find("img"));
            const body = $(panel).find("img").nextUntil("span.lp-more-details").map((i, e) => extractContentHtml($(e), this)).get().join("");
            return {link, img: {src: imgSrc}, body};
        }).get();
        return {type: "featured-news", columnCount, title, items};
    }
}

module.exports = FeaturedNewsConverter;