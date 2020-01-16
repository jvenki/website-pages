import MigrationError, {ErrorCode, ConversionIssueCode} from "../MigrationError";
import {headingRegex as faqHeadingRegex} from "./FAQHandler";

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

export const isElementAHeadingNode = ($e) => ["h2", "h3", "h4", "h5", "h6", "h7"].includes($e.get(0).tagName);
export const isElementAContentNode = ($e) => isElementATextualNode($e) || isElementATableNode($e) || (isElementASubHeadingNode($e) && !$e.text().match(faqHeadingRegex));

const isElementASubHeadingNode = ($e) => ["h3", "h4", "h5", "h6", "h7"].includes($e.get(0).tagName);
const isElementATextualNode = ($e) => ["p", "ul", "ol", "li", "strong", "em", "a", "br", "u", "img"].includes($e.get(0).tagName) || $e.get(0).type == "text";
const isElementATableNode = ($e) => $e.hasClass("hungry-table") || $e.hasClass("js-hungry-table") || $e.hasClass("table") || $e.get(0).tagName == "table";

export const extractHeadingText = ($e, $) => {
    const whilelistedTags = ["strong"];
    if ($e.children().length > 0) {
        $e.find("*").each((i, c) => {
            if (!whilelistedTags.includes(c.tagName)) {
                throw new MigrationError(ConversionIssueCode.HEADING_HAS_CHILDREN, undefined, `Found ${c.tagName} inside \n ${$e.toString()}`);
            }
        });        
    }
    return $e.text();
};

export const extractLinkText = ($e, $) => {
    const whilelistedTags = ["img", "picture", "p", "span"];
    if ($e.children().length > 0) {
        $e.find("*").each((i, c) => {
            if (!whilelistedTags.includes(c.tagName)) {
                throw new MigrationError(ConversionIssueCode.HEADING_HAS_CHILDREN, undefined, `Found ${c.tagName} inside \n ${$e.toString()}`);
            }
        });        
    }
    return $e.text();
};

export const extractContentHtml = ($e, $) => {
    let html;
    if (isElementATextualNode($e)) {
        html = extractHtmlFromTextualNodes($e, $);
    } else if (isElementATableNode($e)) {
        html = extractHtmlFromTableCreatedUsingTableNode($e, $);
    } else if (["div"].includes($e.get(0).tagName)) {
        html = $e.children().map((i, c) => extractContentHtml($(c), $)).get().join("");
    } else if (["td"].includes($e.get(0).tagName)) {
        cleanseAndValidateElement($e);
        html = $e.html();
    } else if (isElementASubHeadingNode($e)) {
        if ($e.get(0).tagName != "h3") {
            if ($e.children().length == 1 && $e.children().get(0).tagName == "u") {
                html = `<strong>${extractContentHtml($($e.children().get(0)), $)}</strong>`;
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

const extractHtmlFromTextualNodes = ($e, $) => {
    const validateInnerHtml = ($c) => {
        $c.find("*").each((i, d) => {
            if (!isElementATextualNode($(d))) {
                throw new MigrationError(ConversionIssueCode.NON_CONTENT_NODE, undefined, `Found ${d.tagName} inside \n ${$c.toString()}`);
            }
        });    
    };

    validateInnerHtml($e);
    cleanseAndValidateElement($e);
    return $e.toString();
};

const extractHtmlFromTableCreatedUsingTableNode = ($e, $) => {
    // Upon analysis it was found that TBODY had TH only in 689, 25814 & 25815. Therefore we can be sure that THEAD is the only way to see header.
    assert($e.find("table thead tr").length <= 1, "More than one Header Row was found which is not right", $e);
    assert($e.find("table thead tr td").length == 0, "THEAD has TD cells which is not right", $e);
    assert($e.find("table tbody tr").length > 0, "No rows were found in TBODY which is not right", $e);
    assert($e.find("table tbody tr th").length == 0, "TBODY has TH cells which is not right", $e);

    const createCell = (tagName, cellContent, attribs) => {
        let output = "<" + tagName;
        if (attribs && attribs.colspan) {
            output += ` colspan="${attribs.colspan}"`;
        }
        output += ">";
        output += cellContent;
        output += `</${tagName}>`;
        return output;
    };

    const extractBodyRows = () => {
        const bodyRows = $e.find("table tbody tr").map((ri, tr) => {
            const cells = $(tr).children().map((ci, td) => {
                return createCell("td", extractContentHtml($(td), $), td.attribs);
            }).get();

            return `<tr>${cells.join("")}</tr>`;
        }).get();
        return {bodyRows};
    };

    const extractHeaderRows = () => {
        const headerRows = $e.find("table thead tr").map((ri, tr) => {
            const cells = $(tr).children().map((ci, th) => createCell("th", extractHeadingText($(th), $), th.attribs)).get();
            return `<tr>${cells.join("")}</tr>`;
        }).get();
        return headerRows;
    };

    const {bodyRows} = extractBodyRows();
    const headerRows = extractHeaderRows();
    let output = "<table>";
    if (headerRows.length > 0) {
        output += `<thead>${headerRows[0]}</thead>`;
    }
    output += `<tbody>${bodyRows.join("")}</tbody>`;
    output += "</table>";
    return output;
};

const cleanseAndValidateElement = ($e) => {
    const whiteListedAttrs = ["id", "href", "src", "title", "data-original", "colspan"];
    const blackListedAttrs = ["style", "align", "alt", "class"];
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
        assert(link.attribs.href.indexOf("#") == -1, "Local Link used", $e);
    });
    if ($e.get(0).tagName == "a") {
        assert($e.get(0).attribs.href.indexOf("#") == -1, "Local Link used", $e);
    }
};
