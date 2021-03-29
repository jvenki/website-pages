// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import { extractHeadingText, extractContentHtml } from "./Utils";

export default class ResponsiveTableHandler extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType, $: CheerioDocType): boolean {
        return $element.hasClass("tabular-section");
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $e = elements[0];
        const headerRowCells = $e.find(".tabular-title .tabular-column").map((i, th) => createCell("th", extractHeadingText($(th), $), {scope: "col"})).get();
        const bodyRows = [];
        $e.find(".tabular-data").each((i, tr) => {
            if ($(tr).hasClass("tabular-title")) {
                return;
            }
            const cells = $(tr).find(".tabular-column").map((j, td) => createCell("td", extractCellContent($(td), $))).get();
            bodyRows.push(`<tr>${cells.join("")}</tr>`);
        });
        let output = "<table>";
        if (headerRowCells.length > 0) {
            output += `<thead><tr>${headerRowCells.join("")}</tr></thead>`;
        }
        output += `<tbody>${bodyRows.join("")}</tbody>`;
        output += "</table>";

        return {elements: [{type: "responsive-table", body: output}]};
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