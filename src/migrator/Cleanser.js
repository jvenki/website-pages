const cheerio = require("cheerio");
const minify = require("html-minifier").minify;
const winston = require("winston");
const MigrationError = require("./MigrationError");

class Cleanser {
    cleanse(html) {
        winston.verbose("\tCleaning our HTML...");
        winston.debug("Given HTML\n" + html);
        html = makeHTMLValid(html);
        const cleansedHtml = minifyHtml(html);
        winston.debug("Cleansed HTML\n" + cleansedHtml);

        const cleansers = [
            removeEmptyNodesAndEmptyLines, 
            removeUnncessaryRootElement, 
            removeStyleAndScriptNodes, 
            removeTableOfContents,
            removeDisqusElements,
            removeOfferTableElements
        ];
        const $ = cheerio.load(cleansedHtml, {decodeEntities: false});
        cleansers.forEach((cleanser) => cleanser($));

        return $.html();
    }
}

const makeHTMLValid = (html) => {
    // The below cleanup is required in 33 and 187
    let cleansedHtml = 
        html.replace(/“/g, "\"").replace(/“/g, "\"").replace(/’/g, "'").replace(/‘/g, "'")
            .replace(/<<\s*>>/g, /&lt;&lt; &gt;&gt;/)
            .replace(/<table table-curved">/, "<table class=\"table table-curved\">")
            .replace(/< Rs/g, "&lt; Rs");
    cleansedHtml = minify(cleansedHtml, {collapseWhitespace: true, removeComments: true, continueOnParseError: true});
    cleansedHtml = cleansedHtml.replace(/<<div/g, "<div");
    return cleansedHtml;
};

const minifyHtml = (html) => {
    try {
        return minify(html, {collapseWhitespace: true, removeComments: true, removeEmptyAttributes: true, removeRedundantAttributes: true});
    } catch (err) {
        winston.debug("Unable to Parse the HTML\n" + err);
        throw new MigrationError(MigrationError.Code.HTML_PARSE_ERROR);
    }
};

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
    $("*").removeClass("ir-section").removeClass("product-hl-table");
};

const removeUnncessaryRootElement = ($) => {
    let recheck = false;
    $("*").each((i, e) => {
        const $e = $(e);
        // h tag was used in #39
        const hasUnncessaryRootDiv = ["primary-txt", "article-txt", "product-content", "bank-prod-page", "h"].some((cn) => $e.hasClass(cn) || $e.get(0).tagName == cn);
        if (hasUnncessaryRootDiv) {
            $($e.html()).insertAfter($e);
            $e.remove();
            recheck = true;
        }
    });

    if (recheck) {
        removeUnncessaryRootElement($);
    }
};

const removeTableOfContents = ($) => {
    $("table").each((i, t) => {
        $(t).find("a").each((j, a) => {
            if ($(a).attr("href") && $(a).attr("href").startsWith("#")) {
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