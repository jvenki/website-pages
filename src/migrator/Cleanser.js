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
            moveContentsOfDDToLI
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
            .replace(/<ins>([a-zA-Z0-9?\-.,:()\s\\/]*)<\/ins>/g, "<u>$1</u>")  // Found in LPD#856
            .replace(/<ins><strong>([a-zA-Z0-9?\-.,:()\s\\/]*)<\/strong><\/ins>/g, "<u><strong>$1</strong></u>")  // Found in LPD#856
            .replace(/<h2 id="faq">([a-zA-Z0-9\s]*)<\/h3>/, "<h2>$1</h2>")  // Found in LPD#8
            .replace(/<i>([a-zA-Z0-9?\-.,:()\s\\/]*)<\/i>/g, "<em>$1</em>")  // Found in LPD#9
            .replace(/<b>([a-zA-Z0-9?\-.,:()\s\\/]*)<\/b>/g, "<strong>$1</strong>")  // Found in LPD#57
            .replace(/<span style="text-decoration: underline;">([[a-zA-Z0-9?\-.:\s]*)<\/span>/g, "<u>$1</u>") // Found in #LPD#37
            .replace(/\s*tax-img-responsive\s*/g, "") // Found in LPD#38
            .replace(/<srtong>([a-zA-Z0-9?\-.,:()\s\\/]*)<\/srtong>/g, "<strong>$1</strong>") // Found in LPD#48
            .replace(/<stong>([a-zA-Z0-9?\-.,:()\s\\/]*)<\/stong>/g, "<strong>$1</strong>") // Found in LPD#230
            .replace(/<h1>([a-zA-Z0-9?\-.,:()\s\\/]*)<\/h1>/g, "<h2>$1</h2>") // Found in LPD#123
            .replace(/”/g, "\"").replace(/”/g, "\"")  // Found in LPD#3574
            .replace(/col sm-/g, "col-sm-") // Found in 4862
        ;
    cleansedHtml = minify(cleansedHtml, {collapseWhitespace: true, removeComments: true, continueOnParseError: true});
    cleansedHtml = 
        cleansedHtml.replace(/<\/div><br>/g, "</div>") // Found in LPD#859
            .replace(/<\/p><br>/g, "</p>") // Found in LPD#856
            .replace(/<address><p>([a-zA-Z0-9?\-.,:()\s\\/]*)<\/p><\/address>/g, "<p>$1</p>")  //Found in LPD#33
            .replace(/<ul><li><h2>([a-zA-Z0-9?\-.,:()\s\\/]*)<\/h2><\/li><\/ul>/g, "<h2>$1</h2>")
            .replace(/<small>([a-zA-Z0-9?\-.,:()\s\\/]*)<\/small>/g, "<em>$1</em>")
            .replace(/>&nbsp;</g, "><") // Found in 10056
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
    const whiteListedTagsThatCanBeEmpty = ["iframe", "img", "br", "td", "th"];
    const whiteListedClassNamesThatCanBeEmpty = ["span.simplified-landing-banner-icons", "span.simplified-banner-icons"];

    const emptyNodes = [];
    $("*").each((i, e) => {
        if ($(e).html() != "") {
            return;
        }
        if (whiteListedTagsThatCanBeEmpty.includes(e.tagName)) {
            return;
        }
        if (whiteListedClassNamesThatCanBeEmpty.some((tagNclass) => {const [tagName, className] = tagNclass.split("."); return e.tagName == tagName && $(e).hasClass(className);})) {
            return;
        }

        const $parent = $(e).parent();
        emptyNodes.push($(e).toString());
        $(e).remove();
        removeEmptyAncestors($parent, $);
    });

    onIssue(new MigrationError(CleanserIssueCode.REMOVED_EMPTY_NODES, undefined, "Count = " + emptyNodes.length));
};

const removeStyleAndScriptNodes = ($, onIssue) => {
    ["style", "script", "figcaption", ".js-infographic-content", "mark", "ins", "div.table-view-more", "h1"].forEach((sel) => {
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
        const hasUnncessaryTag = false;
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
        if ($(dl).children().length == 1 && $(dl).children().eq(0).children().length == 1 && $(dl).prev().get(0).tagName == "ul") {
            $($(dl).children().eq(0).html()).appendTo($(dl).prev().find("li:last-child"));
        }
        $(dl).remove();
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

const removeTableOfContents = ($, onIssue) => {
    const customTOCs = [];
    $("table, ul").each((i, t) => {
        let isTOC = false;
        $(t).find("a").each((j, a) => {
            if ($(a).attr("href") && $(a).attr("href").startsWith("#")) {
                const $parent = $(a).parent();
                isTOC = true;
                $(a).remove();
                removeEmptyAncestors($parent);
            }
        });
        if (isTOC) {
            customTOCs.push($(t).toString());
        }
    });
    if (customTOCs.length > 0) {
        onIssue(new MigrationError(CleanserIssueCode.REMOVED_TOC, undefined, customTOCs.join("")));
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

const unwrapElement = ($e, $) => {
    $($e.html()).insertAfter($e);
    const newElement = $e.next();
    $e.remove();
    return newElement;
};
