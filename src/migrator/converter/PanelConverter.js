const BaseConverter = require("./BaseConverter");
const {computeColumnCount, extractContentHtml, extractImgSrc} = require("./Utils");

class JumbotronConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        const title = $element.children().first().text();
        const body = $element.children().first().nextAll().map((i, e) => extractContentHtml($(e), this)).get().join("");
        return {type: "panel", title, body};
    }
}

class BlockQuoteConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        const title = $element.children().first().text();
        const body = $element.children().first().nextAll().map((i, e) => extractContentHtml($(e), this)).get().join("");
        return {type: "blockquote", title, body};
    }
}

class WidgetConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        const columnCount = computeColumnCount($element.find(".lp-widget-panel"));
        const items = $element.find(".lp-widget-details").map((i, panel) => {
            const imgSrc = extractImgSrc($(panel).find("img"));
            const title = $(panel).find("strong").text();
            const body = $(panel).find("strong").nextUntil("a").map((i, e) => extractContentHtml($(e), this)).get();
            const link = $(panel).find("a").attr("href");
            return {img: {src: imgSrc}, title, body, link};
        }).get();
        return {type: "widget", items, columnCount};
    }
}

class HighlightConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        const link = $element.find("a").attr("href");
        const title = $element.find("strong").text();
        const imgSrc = extractImgSrc($element.find("img"));
        const body = $element.find("strong").nextAll().map((i, e) => extractContentHtml($(e), this)).get();
        return {type: "highlight", title, link, img: {src: imgSrc}, body};
    }
}

module.exports = {JumbotronConverter, BlockQuoteConverter, WidgetConverter, HighlightConverter};
