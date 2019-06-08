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
            removeOfferTableElements,
        ];

        const cleansedHtml = cleansers.reduce((prevCleansedHtml, cleanser) => cleanser(prevCleansedHtml), html);

        // console.log(chalk.gray.bold("Original HTML"));
        // console.log(chalk.gray(html));
        // console.log(chalk.gray.bold("Cleansed HTML"));
        // console.log(chalk.gray(cleansedHtml));

        return cleansedHtml;
    }
}

const removeEmptyNodesAndEmptyLines = (html) => {
    return minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeEmptyAttributes: true,
        removeEmptyElements: true,
        removeRedundantAttributes: true
    });
}

const removeStyleAndScriptNodes = (html) => {
    const $ = cheerio.load(html, {decodeEntities: false});
    $("style").remove();
    $("script").remove();
    return $("body").html();
}

const removeUnncessaryRootElement = (html) => {
    const $ = cheerio.load(html, {decodeEntities: false});
    if ($("body").children().length == 1 && $("body > div").hasClass("article-txt")) {
        return $("body > div").html();
    }
    return $("body").html();
}

const removeTableOfContents = (html) => {
    const $ = cheerio.load(html, {decodeEntities: false});
    $("table").each((i, t) => {
        $(t).find("a").each((j, a) => {
            if ($(a).attr("href").startsWith("#")) {
                const $parent = $(a).parent();
                $(a).remove();
                removeEmptyAncestors($parent);
            }
        })
    })
    return $("body").html();
}

const removeDisqusElements = (html) => {
    const $ = cheerio.load(html, {decodeEntities: false});
    $("a[href='#disqus_thread']").each((i, a) => {
        const $parent = $(a).parent();
        $(a).remove();
        removeEmptyAncestors($parent);
    })
    return $("body").html();
}

const removeOfferTableElements = (html) => {
    const $ = cheerio.load(html, {decodeEntities: false});
    $("div.container-fluid").each((i, d) => {
        console.warn("\t[CAUTION]: Removing the element with class as 'container-fluid'", $(d).html());
        $(d).remove();
    })
    return $("body").html();
}

const pullUpRootLevelElements = (html) => {
    const $ = cheerio.load(html, {decodeEntities: false});
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
    return $("body").html();
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