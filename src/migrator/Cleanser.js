// @flow
import cheerio from "cheerio";
const minify = require("html-minifier").minify;
import {logger} from "./Logger";
import MigrationError, {ErrorCode, CleanserIssueCode} from "./MigrationError";
import pretty from "pretty";
import {removePositioningClass, removePaddingClass, computeNodeName} from "./handlers/Utils";

export default class Cleanser {
    cleanse(html: string, onIssue: (err: MigrationError) => void) {
        logger.verbose("    Cleaning our HTML...");
        logger.silly("Given HTML\n" + html);
        html = makeHTMLValid(html);
        const cleansedHtml = minifyHtml(html);

        const cleansers = [
            removeStyleAndScriptNodes, 
            removeEmptyNodesAndEmptyLines, 
            unwrapElements,
            removeRowLevelGridsUnderRows,
            removeUnwantedGridsUnderBody, 
            unwrapElements,
            // removeTableOfContents,
            removeDisqusElements,
            removeOfferTableElements,
            moveContentsOfDDToLI,
            moveContentsOfDivToLI,
            moveBigTxtIntoNewsFeed,
        ];
        const $ = cheerio.load(cleansedHtml, {decodeEntities: false});
        cleansers.forEach((cleanser) => cleanser($, onIssue));

        logger.silly("Cleansed HTML\n" + pretty($.html()));
        return $.html();
    }
}

const makeHTMLValid = (html) => {
    let cleansedHtml = 
        html.replace(/“/g, "\"").replace(/“/g, "\"").replace(/’/g, "'").replace(/‘/g, "'").replace(/–/g, "-")  // Remove MSWord style Quotations
            .replace(/<<\s*>>/g, "&lt;&lt; &gt;&gt;").replace(/< Rs/g, "&lt; Rs")   // Escape the angle-brackets
            .replace(/<ins>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/ins>/g, "<u>$1</u>")  // Found in LPD#856
            .replace(/<ins><strong>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/strong><\/ins>/g, "<u><strong>$1</strong></u>")  // Found in LPD#856
            .replace(/<h2 id="faq">([a-zA-Z0-9\s]*)<\/h3>/, "<h2>$1</h2>")  // Found in LPD#8
            .replace(/<i>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/i>/g, "<em>$1</em>")  // Found in LPD#9
            .replace(/<b>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/b>/g, "<strong>$1</strong>")  // Found in LPD#57
            .replace(/<span style="text-decoration: underline;">([[a-zA-Z0-9?\-.:\s]*)<\/span>/g, "<u>$1</u>") // Found in #LPD#37
            .replace(/\s*tax-img-responsive\s*/g, "") // Found in LPD#38
            .replace(/<srtong>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/srtong>/g, "<strong>$1</strong>") // Found in LPD#48
            .replace(/<stong>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/stong>/g, "<strong>$1</strong>") // Found in LPD#230
            .replace(/<strog>/g, "<strong>").replace(/<\/strog>/g, "</strong>") // Found in LPD#5569
            .replace(/<h1>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/h1>/g, "<h2>$1</h2>") // Found in LPD#123
            .replace(/”/g, "\"").replace(/”/g, "\"")  // Found in LPD#3574
            .replace(/col sm-/g, "col-sm-") // Found in 4862
            .replace(/<policy number>/g, "&lt; policy number &gt;") // Found in 26131
        ;
    cleansedHtml = minify(cleansedHtml, {collapseWhitespace: true, removeComments: true, continueOnParseError: true});
    cleansedHtml = 
        cleansedHtml.replace(/<\/div><br>/g, "</div>") // Found in LPD#859
            .replace(/<\/p><br>/g, "</p>") // Found in LPD#856
            .replace(/<ul><li><h2>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/h2><\/li><\/ul>/g, "<h2>$1</h2>")
            .replace(/<small>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/small>/g, "<em>$1</em>")
            .replace(/>&nbsp;</g, "><") // Found in 10056
            .replace(/<q><em><strong>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/strong><\/em><\/q>/, "<blockquote>$1</blockquote>") // Found in 733
            .replace(/<q><b><em>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/em><\/b><\/q>/, "<blockquote>$1</blockquote>") // Found in 26821
            .replace(/<q><em>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/em><\/q>/, "<blockquote>$1</blockquote>") // Found in 12376
    ;

    return cleansedHtml;
};

const minifyHtml = (html) => {
    try {
        return minify(html, {collapseWhitespace: true, removeComments: true, removeEmptyAttributes: true, removeRedundantAttributes: true});
    } catch (err) {
        throw new MigrationError(ErrorCode.HTML_PARSE_ERROR, undefined, err);
    }
};

const removeEmptyNodesAndEmptyLines = ($, onIssue) => {

    const emptyNodes = [];
    $("*").each((i, e) => {
        const $e = $(e);
        const $parent = $e.parent();
        const status = removeEmptyNode($e, $);
        if (status) {
            emptyNodes.push($e.toString());    
            removeEmptyAncestors($parent, $);
        }
    });

    onIssue(new MigrationError(CleanserIssueCode.REMOVED_EMPTY_NODES, undefined, "Count = " + emptyNodes.length));
};

const removeStyleAndScriptNodes = ($, onIssue) => {
    ["style", "script", "figcaption", ".js-infographic-content", "mark", "ins", "div.table-view-more", "h1", "div.adt"].forEach((sel) => {
        const elems = $(sel);
        if (elems.length == 0) {
            return;
        }
        onIssue(new MigrationError(CleanserIssueCode.REMOVED_NODES, sel, "Count = " + elems.length));
        elems.remove();
    });

    $("a").each((i, a) => {
        const $a = $(a);
        const link = $a.attr("href");
        if (link && link.indexOf("-elections") != -1 && $a.parent().get(0).tagName == "strong") {
            $a.parent().remove();
        }
    });
};

const unwrapElements = ($, onIssue) => {
    const unwrapIfNeccessary = ($e) => {
        const hasUnncessaryDivWithClass = ["primary-txt", "article-txt", "product-content", "bank-prod-page", "product-description"].some((cn) => $e.hasClass(cn));
        const hasUnncessaryTag = ["space", "picture", "address"].includes($e.get(0).tagName);
        if (hasUnncessaryDivWithClass || hasUnncessaryTag) {
            onIssue(new MigrationError(CleanserIssueCode.REMOVED_HFM_NODE, computeNodeName($e), "Count = 1"));
            $e = unwrapElement($e, $);
            unwrapIfNeccessary($e);
        }
    };
    $("*").children().each((i, c) => unwrapIfNeccessary($(c)));
    $("*").removeClass("ir-section");   //Used in LPD#9
};

const moveContentsOfDDToLI = ($, onIssue) => {
    $("body").find("dl").each((i, dl) => {
        if ($(dl).children().length == 1 && $(dl).children().eq(0).children().length == 1 && $(dl).prev().length > 0 && $(dl).prev().get(0).tagName == "ul") {
            $($(dl).children().eq(0).html()).appendTo($(dl).prev().find("li:last-child"));
        }
        $(dl).remove();
    });
};

const moveContentsOfDivToLI = ($, onIssue) => {
    $("li ~ div").each((i, div) => {
        const $div = $(div);
        if ($div.children().length == 1 && ["p", "img"].includes($div.children().eq(0).get(0).tagName)) {
            $("<br>" + $div.html()).appendTo($div.prev());
            $div.remove();
        }
    });
};

const moveBigTxtIntoNewsFeed = ($, onIssue) => {
    $("body").find("div.bigtxt").each((i, e) => {
        const $e = $(e);
        if ($e.next().hasClass("news-widget") && $e.next().find("> .bigtxt").length == 0) {
            $e.prependTo($e.next());
        }
    });
};

const removeUnwantedGridsUnderBody = ($, onIssue, depth=0) => {
    const isGridElement = ($e) => $e.attr("class") && $e.attr("class").match(/^row$|^col-md-12$|^row btm-pad$/);
    const allAreGrids = $("body").children().get().every((c) => isGridElement($(c)));
    if (!allAreGrids) {
        return;
    }
    $("body").children().each((i, c) => {unwrapElement($(c), $); onIssue(new MigrationError(CleanserIssueCode.REMOVED_GRID_ROW_NODE, computeNodeName($(c)), "Count = 1"));});
    removeUnwantedGridsUnderBody($, onIssue, depth+1);
};

const removeRowLevelGridsUnderRows = ($, onIssue, depth=0) => {
    let recheck = false;
    // The following class names represents 100% and there is no point of having two 100% wide DIVs. Lets remove the child as parent can handle it.
    ["div.col-md-12 > div.row", "div.col-md-12 > div.col-md-12", "div.row > div.row", "div.row > div.col-md-12"].forEach((className) => {
        const expectedParentCN = className.split(">")[0].split(".")[1].trim();
        const expectedChildCN = className.split(">")[1].split(".")[1].trim();
        $(className).each((i, c) => {
            const childCN = removePaddingClass(removePositioningClass($(c).attr("class"))).replace(expectedChildCN, "");
            const parentCN = removePaddingClass(removePositioningClass($(c).parent().attr("class"))).replace(expectedParentCN, "");
            if (!childCN && !parentCN) {
                unwrapElement($(c), $);
                onIssue(new MigrationError(CleanserIssueCode.REMOVED_GRID_ROW_NODE, computeNodeName($(c)), "Count = 1"));
                recheck = true;
            }
        });
    });
    if (recheck) {
        removeRowLevelGridsUnderRows($, onIssue, depth+1);
    }
};

const removeDisqusElements = ($, onIssue) => {
    $("a[href='#disqus_thread']").each((i, a) => {
        onIssue(new MigrationError(CleanserIssueCode.REMOVED_DISQUS));
        const $parent = $(a).parent();
        $(a).remove();
        removeEmptyAncestors($parent);
    });
};

const removeOfferTableElements = ($, onIssue) => {
    $("div.container-fluid").each((i, d) => {
        onIssue(new MigrationError(CleanserIssueCode.REMOVED_OFFER, undefined, $(d).toString()));
        $(d).remove();
    });
};

const removeEmptyNode = ($e, $) => {
    const whiteListedTagsThatCanBeEmpty = ["iframe", "img", "br", "td", "th"];
    const whiteListedClassNamesThatCanBeEmpty = ["span.simplified-landing-banner-icons", "span.simplified-banner-icons", "div.tabular-column"];

    const e = $e.get(0);
    if ($e.html() != "") {
        return false;
    }
    if (whiteListedTagsThatCanBeEmpty.includes(e.tagName)) {
        return false;
    } else if (whiteListedClassNamesThatCanBeEmpty.some((tagNclass) => {const [tagName, className] = tagNclass.split("."); return e.tagName == tagName && $e.hasClass(className);})) {
        return false;
    } else if (e.tagName == "strong" && $e.parent().get(0).tagName == "td") {
        return false;
    }

    $e.remove();
    return true;
};

const removeEmptyAncestors = ($e, $) => {
    while (true) {
        const $p = $e.parent();
        const status = removeEmptyNode($e, $);
        if (!status) {
            break;
        }
        $e = $p;
    }
};

const unwrapElement = ($e, $) => {
    $($e.html()).insertAfter($e);
    const newElement = $e.next();
    $e.remove();
    return newElement;
};
