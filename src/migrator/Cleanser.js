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
            removeEmptyNodesAndEmptyLines, 
            removeDivsWithHFMClassNamesUnderBody,
            removeRowLevelGridsUnderRows,
            removeUnwantedGridsUnderBody, 
            removeStyleAndScriptNodes, 
            // removeTableOfContents,
            removeDisqusElements,
            removeOfferTableElements
        ];
        const $ = cheerio.load(cleansedHtml, {decodeEntities: false});
        cleansers.forEach((cleanser) => cleanser($, onIssue));

        logger.silly("Cleansed HTML\n" + pretty($.html()));
        return $.html();
    }
}

const makeHTMLValid = (html) => {
    let cleansedHtml = 
        html.replace(/“/g, "\"").replace(/“/g, "\"").replace(/’/g, "'").replace(/‘/g, "'")  // Remove MSWord style Quotations
            .replace(/<<\s*>>/g, "&lt;&lt; &gt;&gt;").replace(/< Rs/g, "&lt; Rs")   // Escape the angle-brackets
            .replace(/<ins>/g, "<u>").replace(/<\/ins>/g, "</u>")  // Found in LPD#856
            .replace(/<h2 id="faq">([a-zA-Z0-9\s]*)<\/h3>/, "<h2>$1</h2>")  // Found in LPD#8
            .replace(/<i>/g, "<em>").replace(/<\/i>/g, "</em>")  // Found in LPD#9
            .replace(/<span style="text-decoration: underline;">([a-zA-Z0-9\s]*)<\/span>/, "<u>$1</u>") // Found in #LPD#37
        ;
    cleansedHtml = minify(cleansedHtml, {collapseWhitespace: true, removeComments: true, continueOnParseError: true});
    cleansedHtml = 
        cleansedHtml.replace(/<\/div><br>/g, "</div>") // Found in LPD#859
            .replace(/<\/p><br>/g, "</p>") // Found in LPD#856
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
        if ($(e).html() == "" && !["iframe", "img", "br"].includes(e.tagName)) {
            const $parent = $(e).parent();
            emptyNodes.push($(e).toString());
            $(e).remove();
            removeEmptyAncestors($parent, $);
        }
    });

    onIssue(new MigrationError(CleanserIssueCode.REMOVED_EMPTY_NODES, undefined, "Count = " + emptyNodes.length));
};

const removeStyleAndScriptNodes = ($, onIssue) => {
    const styleNodesFound = $("style").length;
    const scriptNodesFound = $("script").length;
    $("style").remove();
    $("script").remove();

    scriptNodesFound && onIssue(new MigrationError(CleanserIssueCode.REMOVED_SCRIPT_NODES, undefined, "Count = " + scriptNodesFound));
    styleNodesFound && onIssue(new MigrationError(CleanserIssueCode.REMOVED_STYLE_NODES, undefined, "Count = " + styleNodesFound));
};

const removeDivsWithHFMClassNamesUnderBody = ($, onIssue) => {
    const unwrapIfNeccessary = ($e) => {
        const hasUnncessaryRootDiv = ["primary-txt", "article-txt", "product-content", "bank-prod-page"].some((cn) => $e.hasClass(cn));
        if (hasUnncessaryRootDiv) {
            onIssue(new MigrationError(CleanserIssueCode.REMOVED_HFM_NODE, computeNodeName($e), "Count = 1"));
            $e = unwrapElement($e, $);
            unwrapIfNeccessary($e);
        }
    };
    $("body").children().each((i, c) => unwrapIfNeccessary($(c)));
    $("*").removeClass("ir-section");   //Used in LPD#9
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
