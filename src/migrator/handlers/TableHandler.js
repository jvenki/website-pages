// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import { extractHeadingText, extractContentHtml, isElementATableNode } from "./Utils";

export class TableHandler_ResponsiveVariant extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType): boolean {
        return $element.hasClass("tabular-section");
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = elements[0];
        const headerRowCells = [{cols: $e.find(".tabular-title .tabular-column").map((i, th) => {
            return {content: extractHeadingText($(th), $)}
        }).get()}];
        const bodyRows = [];
        $e.find(".tabular-data").each((i, tr) => {
            if ($(tr).hasClass("tabular-title")) {
                return;
            }
            const cells = $(tr).find(".tabular-column").map((j, td) => {
                return {content: extractCellContent($(td), $)}
            }).get();
            bodyRows.push({cols: cells});
        });
        
        const headersAndRows = extractRowsAndHeaders($e, $);
        return {elements: [{type: "table", headers: headerRowCells, rows: bodyRows, responsive: true}]};
    }
}

export class TableHandler_Main extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType) {
        return isElementATableNode($element);
    }
    
    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = $(elements[0]);
        const headersAndRows = extractRowsAndHeaders($e, $);
        return {elements: [{type: "table", data:{...headersAndRows}}]};
    }
}

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

const extractCellContent = ($td, $) => {
    $td.find("span").each((i, span) => span.tagName = "small");
    return extractContentHtml($td, $);
};

const extractRowsAndHeaders = ($e, $) => {
    const tableHead = $e.find("thead");
    const headers = extractRows($(tableHead), $, "td, th", true)
    const tableBody = $e.find("tbody");
    const rows = extractRows($(tableBody), $)
    return {rows: [...headers, ...rows]};    
}

const extractRows = ($e, $, colSelector="td", highlight=false) => {
    return $e.find("tr")
        .map((i, tr) => {
            const cols = $(tr).find(colSelector).map((j, td) => {
                const content = $(td).html();
                const colspan = $(td).attr("colspan") ? parseInt($(td).attr("colspan")) : undefined;
                const rowspan = $(td).attr("rowspan") ? parseInt($(td).attr("rowspan")) : undefined;
                return {content, colspan, rowspan, highlight};
            }).get();
            return {cols}
        }).get();
}