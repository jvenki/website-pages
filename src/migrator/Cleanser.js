const cheerio = require("cheerio");
const minify = require("html-minifier").minify;
const winston = require("winston");

class Cleanser {
    cleanse(html) {
        winston.verbose("\tCleaning our HTML...");
        const cleansers = [
            removeEmptyNodesAndEmptyLines, 
            removeUnncessaryRootElement, 
            removeStyleAndScriptNodes, 
            removeTableOfContents,
            removeDisqusElements,
            removeOfferTableElements
        ];
        const cleansedHtml = minify(html, {collapseWhitespace: true, removeComments: true, removeEmptyAttributes: true, removeRedundantAttributes: true});
        const $ = cheerio.load(cleansedHtml, {decodeEntities: false});
        cleansers.forEach((cleanser) => cleanser($));
        return $.html();
    }
}

const removeEmptyNodesAndEmptyLines = ($) => {
    $("*").each((i, e) => {
        if ($(e).html() == "" && !["iframe", "img", "br"].includes(e.tagName)) {
            const $parent = $(e).parent();
            $(e).remove();
            removeEmptyAncestors($parent, $);
        }
    });
};

const removeStyleAndScriptNodes = ($) => {
    $("style").remove();
    $("script").remove();
};

const removeUnncessaryRootElement = ($) => {
    if ($("body").children().length == 1 && $("body > div").hasClass("article-txt")) {
        $("body").html($("body > div").html());
    }
};

const removeTableOfContents = ($) => {
    $("table").each((i, t) => {
        $(t).find("a").each((j, a) => {
            if ($(a).attr("href").startsWith("#")) {
                const $parent = $(a).parent();
                $(a).remove();
                removeEmptyAncestors($parent);
            }
        });
    });
};

const removeDisqusElements = ($) => {
    $("a[href='#disqus_thread']").each((i, a) => {
        const $parent = $(a).parent();
        $(a).remove();
        removeEmptyAncestors($parent);
    });
};

const removeOfferTableElements = ($) => {
    $("div.container-fluid").each((i, d) => {
        console.warn("\t[CAUTION]: Removing the element with class as 'container-fluid'", $(d).html());
        $(d).remove();
    });
};

const removeEmptyAncestors = ($e, $) => {
    while (true) {
        const $p = $e.parent();
        if ($e.html() == "") {
            $e.remove();
        } else {
            break;
        }
        $e = $p;
    }
};

module.exports = Cleanser;