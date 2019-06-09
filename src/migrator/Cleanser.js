const cheerio = require("cheerio");
const minify = require('html-minifier').minify;
const chalk = require("chalk");


class Cleanser {
    cleanse(html) {
        console.info(chalk.greenBright("Cleaning our HTML..."));
        const cleansers = [
            removeEmptyNodesAndEmptyLines, 
            removeUnncessaryRootElement, 
            removeStyleAndScriptNodes, 
            removeTableOfContents,
            removeDisqusElements,
            removeOfferTableElements
        ];
        let cleansedHtml = minify(html, {collapseWhitespace: true, removeComments: true, removeEmptyAttributes: true, removeRedundantAttributes: true});
        let $ = cheerio.load(cleansedHtml, {decodeEntities: false});
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
}

const removeStyleAndScriptNodes = ($) => {
    $("style").remove();
    $("script").remove();
}

const removeUnncessaryRootElement = ($) => {
    if ($("body").children().length == 1 && $("body > div").hasClass("article-txt")) {
        $("body").html($("body > div").html());
    }
}

const removeTableOfContents = ($) => {
    $("table").each((i, t) => {
        $(t).find("a").each((j, a) => {
            if ($(a).attr("href").startsWith("#")) {
                const $parent = $(a).parent();
                $(a).remove();
                removeEmptyAncestors($parent);
            }
        })
    })
}

const removeDisqusElements = ($) => {
    $("a[href='#disqus_thread']").each((i, a) => {
        const $parent = $(a).parent();
        $(a).remove();
        removeEmptyAncestors($parent);
    })
}

const removeOfferTableElements = ($) => {
    $("div.container-fluid").each((i, d) => {
        console.warn("\t[CAUTION]: Removing the element with class as 'container-fluid'", $(d).html());
        $(d).remove();
    })
}

const pullUpRootLevelElements = ($) => {
    $("body h2").each((i, h2) => {
        const $h2 = $(h2);
        const ancestors = $h2.parentsUntil("body");
        if (ancestors.length == 0) {
            return true;
        }
        console.log($h2.parent().parent().html());
        // H2 should be directly underneath BODY. Check whether we can move them up if it is just blindly wrapped inside DIV or P tags
        ancestors.each((i, p) => {
            // console.log("Inserting after", $(p).parent().)
            $($(p).html()).insertAfter($(p).parent());
            $(p).remove();
        })
        console.log($("body").html());
    });
}

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
}

module.exports = Cleanser;