import MigrationError, {ErrorCode, ConversionIssueCode} from "../MigrationError";
import {headingRegex as faqHeadingRegex} from "./FAQHandler";
import {headingRegex as referencesHeadingRegex, isElementACntrOfExternalLinks} from "./ReferencesHandler";
import {without} from "lodash";

export const assert = (condition, errorMsg, $e) => {
    if (condition) {
        return;
    }

    if (typeof(errorMsg) == "object") {
        throw new MigrationError(errorMsg, undefined, $e.toString());
    }

    throw new MigrationError(ErrorCode.UNKNOWN_TAG, errorMsg, $e.toString());
};

export const computeNodeName = ($e) => {
    const tagName = $e.get(0).tagName;
    const className = ($e.attr("class") || "").replace(/ /g, ".");
    return `${tagName}${className ? "." + className : ""}`;
};

export const computePathNameToElem = ($e, $) => {
    const ancestorName = $e.parentsUntil("body").map((i, p) => computeNodeName($(p))).get();
    return [...ancestorName, computeNodeName($e)].join(" -> ");
};

export const removePaddingClass = (classNames) => {
    return (classNames || "")
        .replace(/lt-pad-\d+/, "").replace(/lt-pad/, "")
        .replace(/rt-pad-\d+/, "").replace(/rt-pad/, "")
        .replace(/btm-pad-\d+/, "").replace(/btm-pad/, "")
        .replace(/top-pad-\d+/, "").replace(/top-pad/, "")
        .replace(/pad-\d+/, "")
        .replace(/pad-none/, "")
        .trim();
};

export const removePositioningClass = (classNames) => {
    return classNames
        .replace(/text-center/g, "")
        .replace(/tcenter/g, "")
        .replace(/text-right/g, "")
        .replace(/text-left/g, "")
        .replace(/pull-left/, "")
        .replace(/pull-right/, "")
        .replace(/clearfix/, "")
        .trim();
};

export const removeBorderClasses = (classNames) => {
    return classNames
        .replace(/border-gallery/g, "")
        .replace(/border-left-[a-z]*/g, "")
        .replace(/border-top-[a-z]*/g, "")
        .replace(/border-btm-[a-z]*/g, "")
        .replace(/border-[a-z]*/g, "")
        .trim();
};

export const removeBGClasses = (classNames) => {
    return classNames
        .replace(/bg-[a-z]*/g, "")
        .trim();
};

export const isElementAHeadingNode = ($e) => $e.length > 0 && ["h2", "h3", "h4", "h5", "h6", "h7"].includes($e.get(0).tagName);
export const isElementAContentNode = ($e) => {
    if (isElementATableNode($e)) {
        return true;
    } else if (isElementATextualNode($e)) {
        if ($e.children().length == 1 && $e.find("strong").length == 1 
            && $e.text() == $e.find("strong").text() 
            && ($e.find("strong").text().match(faqHeadingRegex) || $e.find("strong").text().match(referencesHeadingRegex))
            && $e.find("strong").children().length == 0) {
            throw new MigrationError(ConversionIssueCode.OTHERS, "Possible FAQ/RelatedArticles Section found as TEXTs", $e.toString());
        }
        return true;
    } else if (isElementASubHeadingNode($e)) {
        if ($e.text().match(faqHeadingRegex)) {
            throw new MigrationError(ConversionIssueCode.OTHERS, "Possible FAQ/RelatedArticles Section found as TEXTs", $e.toString());
        } else if ($e.text().match(referencesHeadingRegex) && isElementACntrOfExternalLinks($e.next())) {
            throw new MigrationError(ConversionIssueCode.OTHERS, "Possible FAQ/RelatedArticles Section found as TEXTs", $e.toString());
        }
        return true;
    }
    return false;
};

const isElementASubHeadingNode = ($e) => ["h3", "h4", "h5", "h6", "h7"].includes($e.get(0).tagName);
const isElementATextualNode = ($e) => {
    if ($e.length == 0) {
        return false;
    } else if ($e.get(0).type == "text") {
        return true;
    } else if (["p", "ul", "ol", "li", "strong", "em", "a", "br", "u", "img", "sup"].includes($e.get(0).tagName)) {
        return true;
    }
    return false;
};
export const isElementATableNode = ($e) => {
    if ($e.length == 0) {
        return false;
    } if ($e.get(0).tagName == "table") {
        return true;
    } else if ($e.hasClass("hungry-table") || $e.hasClass("js-hungry-table")) {
        return $e.children().length == 1 && $e.children().first().get(0).tagName == "table";
    } else if ($e.hasClass("product-hl-table")) {
        return true;
    }
    return false;
};

export const extractHeadingText = ($e, $) => {
    const removeUnwantedNodes = ($n) => {
        $n.find("*").get().some((d) => {
            let status = false;
            const $d = $(d);
            cleanseAndValidateElement($d, $);
            if (["p", "sub"].includes(d.tagName) && ["Updated on $date", "Updated on #date", "Updated on ${date}"].includes($d.text().trim())) {
                // This was populated for tables tagged as product-hl-table. We will append this info directly.
                $d.remove();
                status = true;
            } else if (["strong", "em", "u", "p"].includes(d.tagName)) {
                $d.contents().each((i, childOfD) => {
                    $(childOfD).insertAfter($d);
                });
                $d.remove();
                status = true;
            } else if (["a"].includes(d.tagName)) {
                // Nothing to do
            }
            if (status) {
                removeUnwantedNodes($n);
                return true;
            }
        });    
    };

    removeUnwantedNodes($e);
    // Do a final check to ensure that we just have these allowed tags after all the removals above
    const finalChildElemTagNames = without($e.find("*").map((i, d) => d.tagName).get(), ...["a"]);
    assert(finalChildElemTagNames.length == 0, ConversionIssueCode.HEADING_HAS_CHILDREN, `Found ${finalChildElemTagNames.join(",")} in ${$e.toString()}`);
    return ($e.html() || "").trim();
};

export const extractLink = ($e) => {
    const link = $e.attr("href");
    if (!link || link.indexOf("#") == -1) {
        // Excellent. We have not used a local link. Return
        return link;
    }

    if (link.indexOf("#") == link.length-1) {
        // Either the link is just # or an URL with # at the end in which case its fine as the user is not going to navigate anywhere to some section of the URL
        return link;
    } else if (link.substring(link.indexOf("#")+1, link.length) == "get-quote") {
        // We will allow this for now
        return link;
    }
    assert(false, "Local Link used", $e);
};

export const extractLinkText = ($e, $, conditionallyWhitelistedTags) => {
    const whilelistedTags = ["img", "picture", "p", "span", "a", "strong", ...(conditionallyWhitelistedTags || [])];
    if ($e.children().length > 0) {
        $e.find("*").each((i, c) => {
            if (!whilelistedTags.includes(c.tagName)) {
                throw new MigrationError(ConversionIssueCode.HEADING_HAS_CHILDREN, undefined, `Found ${c.tagName} inside \n ${$e.toString()}`);
            }
        });        
    }
    return $e.text().trim();
};

export const extractContentHtml = ($e, $) => {
    let html;
    if ($e.length == 0) {
        return undefined;
    } else if (isElementATextualNode($e)) {
        html = extractHtmlFromTextualNodes($e, $);
    } else if (isElementATableNode($e)) {
        html = extractHtmlFromTableCreatedUsingTableNode($e, $);
    } else if (["div"].includes($e.get(0).tagName)) {
        html = $e.children().map((i, c) => extractContentHtml($(c), $)).get().join("");
    } else if (isElementASubHeadingNode($e)) {
        if ($e.get(0).tagName != "h3") {
            if ($e.children().length == 1 && $e.children().get(0).tagName == "u") {
                html = `<strong>${extractContentHtml($($e.children().get(0)), $)}</strong>`; // To handle a special case in LPD#859 within Jumbotron
            } else {
                html = `<h4>${extractHeadingText($e, $)}</h4>`;
            }
        } else {
            html = `<h3>${extractHeadingText($e, $)}</h3>`;
        }
    } else {
        throw new MigrationError(ConversionIssueCode.NON_CONTENT_NODE, undefined, $e.toString());
    }
    return html.trim();
};

export const extractImgSrc = ($img) => $img.attr("data-original") || $img.attr("src");

const extractImgTag = ($e, $) => {
    let output = "<img";
    ["title", "alt"].forEach((attrName) => {
        if ($e.attr(attrName)) {
            output += ` ${attrName}="${$e.attr(attrName)}"`;
        }
    });
    output += ` src="${extractImgSrc($e)}"`;
    const $p = $e.parent();
    if ($p.get(0).tagName == "div") {
        if ($p.hasClass("pull-right")) {
            output += " class=\"pull-right\"";
        } else if ($p.hasClass("text-center")) {
            output += " class=\"text-center\"";
        }
    }
    output += "/>";
    return output;
};

const createLinkTag = ($e, innerHtml, $) => {
    let output = "<a";
    ["href", "title"].forEach((attrName) => {
        if ($e.attr(attrName)) {
            output += ` ${attrName}="${$e.attr(attrName)}"`;
        }
    });
    if ($e.parent().hasClass("pull-right") && $e.children().length == 1 && $e.children().length == $e.find("img").length) {
        output += " class=\"pull-right\"";
    }
    output += ">";
    output += innerHtml || "";
    output += "</a>";
    return output;
};

const extractHtmlFromTextualNodes = ($e, $) => {
    const processChildNodes = ($n) => $n.contents().map((i, c) => processCurrentNode($(c))).get();

    const processCurrentNode = ($n) => {
        const n = $n.get(0);
        if (n.type == "text") {
            return n.data;
        } else if (n.tagName == "br") {
            return "<br>";
        } else if (n.tagName == "img") {
            return extractImgTag($n, $);  // Has Attributes that needs to be pulled out
        } else if (n.tagName == "a") {
            return createLinkTag($n, processChildNodes($n), $);  // Has Attributes that needs to be pulled out
        } else if (n.tagName == "span") {
            return $n.html();
        } else if (n.tagName == "ul" && $n.children().get().every((li) => $(li).text().trim().match(/^\d+\.\s+/)) && $n.hasClass("list-group")) {
            return `<ol>${processChildNodes($n).map((n) => n.replace(/<li>\d+\.\s+/, "<li>")).join("")}</ol>`;   // Convert UL with manual numbering to OL
        } else if (isElementASubHeadingNode($n)) {
            return `<strong>${processChildNodes($n).join("")}</strong>`;
        } else if (isElementATableNode($n)) {
            return extractHtmlFromTableCreatedUsingTableNode($n, $);
        } else if (isElementATextualNode($n)) {
            return `<${n.tagName}>${processChildNodes($n).join("")}</${n.tagName}>`;
        } else {
            throw new MigrationError(ConversionIssueCode.NON_CONTENT_NODE, undefined, `Found ${n.tagName} inside \n ${$e.toString()}`);
        }
    };

    return processCurrentNode($e);
};

const extractHtmlFromTableCreatedUsingTableNode = ($e, $) => {
    // Upon analysis it was found that TBODY had TH only in 689, 25814 & 25815. Therefore we can be sure that THEAD is the only way to see header.
    // assert($e.find("table thead tr").length <= 1, "More than one Header Row was found which is not right", $e);
    assert($e.find(".product-hl-table-head").length == 0 || $e.find("table thead tr").length == 0, "More than one Header Row was found which is not right", $e);
    assert($e.find("table thead tr td").length == 0, "THEAD has TD cells which is not right", $e);
    assert($e.find("table tbody tr").length > 0, "No rows were found in TBODY which is not right", $e);
    // assert($e.find("table tbody tr th").length == 0, "TBODY has TH cells which is not right", $e);

    const createCell = (tagName, cellContent, attribs) => {
        let output = "<" + tagName;
        if (attribs) {
            if (attribs.colspan) output += ` colspan="${attribs.colspan}"`;
            if (attribs.rowspan) output += ` rowspan="${attribs.rowspan}"`;
        }
        output += ">";
        output += cellContent;
        output += `</${tagName}>`;
        return output;
    };

    const extractBodyRows = () => {
        let maxColumnCount = 0;
        const bodyRows = $e.find("table tbody tr").map((ri, tr) => {
            const isTRActuallyAHeader = $(tr).hasClass("bg-tory-blue");
            const cellCount = $(tr).children().length;
            const cells = $(tr).children().map((ci, td) => {
                const isTDActuallyATH = (Boolean($(td).attr("class")) && (ri == 0 && cellCount > 2 || ci == 0)) || isTRActuallyAHeader || td.tagName == "th";
                const cellBody = $(td).contents().map((k, c) => extractContentHtml($(c), $)).get().join(" ");
                return createCell(isTDActuallyATH ? "th" : "td", cellBody, td.attribs);
            }).get();
            maxColumnCount = Math.max(cells.length, maxColumnCount);
            return `<tr>${cells.join("")}</tr>`;
        }).get();
        return {bodyRows, maxColumnCount};
    };

    const extractHeaderRows = (maxColumnCount) => {
        const headerRows = $e.find("table thead tr").map((ri, tr) => {
            const cells = $(tr).children().map((ci, th) => createCell("th", extractHeadingText($(th), $), th.attribs)).get();
            return `<tr>${cells.join("")}</tr>`;
        }).get();
        if ($e.find(".product-hl-table-head").length > 0) {
            const specialHeader = $e.find(".product-hl-table-head").text();
            // const specialSubHeader = $e.parent().prev().find("sub").text();
            headerRows.push(`<tr><th colspan="${maxColumnCount}">${specialHeader} - (Updated on $date)</th></tr>`);
        }
        return headerRows;
    };

    const {bodyRows, maxColumnCount} = extractBodyRows();
    const headerRows = extractHeaderRows(maxColumnCount);
    let output = "<table>";
    if (headerRows.length > 0) {
        output += `<thead>${headerRows.join("")}</thead>`;
    }
    output += `<tbody>${bodyRows.join("")}</tbody>`;
    output += "</table>";
    return output;
};

const cleanseAndValidateElement = ($e, $) => {
    const whiteListedAttrs = ["href", "src", "title", "data-original", "colspan", "rowspan"];
    const blackListedAttrs = ["id", "style", "align", "alt", "class", "rel"];
    const validateAttrs = (c) => {
        if (!c.attribs) return;
        const unknownAttrs = Object.keys(c.attribs).filter((k) => !whiteListedAttrs.includes(k));
        assert(unknownAttrs.length == 0, "Unknown attribute given - " + unknownAttrs.join(","), $e);
    };

    blackListedAttrs.forEach((attrName) => $e.find("*").removeAttr(attrName));
    blackListedAttrs.forEach((attrName) => $e.removeAttr(attrName));

    $e.find("*").each((i, c) => validateAttrs(c));
    validateAttrs($e.get(0));

    $e.find("a").each((i, link) => {
        extractLink($(link));
    });
    if ($e.get(0).tagName == "a") {
        extractLink($e);
    }
};

export const hasClass = (node, regex) => ((node.attribs || {}).class || "").match(regex);

export const isElementMadeUpOfOnlyWithGivenDescendents = ($e, descendentTagNames, $) => {
    const recurse = ($n, depth) => {
        if ($n.contents().length == 0) {
            return false;
        }

        return $n.contents().get().every((d) => {
            if (d.tagName != descendentTagNames[depth]) {
                return false;
            }
            if (depth < descendentTagNames.length) {
                return recurse($(d), depth+1);
            }
            return true;
        });
    };
    return recurse($e, 0);
};
