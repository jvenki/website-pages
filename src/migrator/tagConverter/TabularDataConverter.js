const BaseConverter = require("./BaseConverter");
const {extractContentHtml} = require("./Utils");

class TabularDataConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        let header;
        const body = [];
        if ($element.hasClass("tabular-data")) {
            $element.find(".tabular-data").each((i, row) => {
                const $row = $(row);
                const rowData = [];
                $(row).find("div").each((i, col) => {
                    const cellBody = extractContentHtml($(col), this);
                    rowData.push(cellBody);
                });
                if ($row.hasClass("tabular-title")) {
                    header = rowData;
                } else {
                    body.push(rowData);
                }
            });
        } else {
            let tbodyStartingIndex = 0;
            let $headerRow;
            if ($element.find("thead").length == 0) {
                $headerRow = $element.find("tbody tr").first();
                if ($headerRow.find("td").length == 2) {
                    $headerRow = undefined;
                } else {
                    tbodyStartingIndex = 1;
                }
            } else {
                $headerRow = $element.find("thead tr");
            }
            if ($headerRow) {
                header = ($headerRow.find("th").length > 0 ? $headerRow.find("th") : $headerRow.find("td")).map((i, h) => $(h).text()).get();
            }
            $element.find("tr").each((i, row) => {
                if (i < tbodyStartingIndex) {
                    return true;
                }
                const rowData = $(row).find("td").map((j, col) => extractContentHtml($(col), this)).get();
                body.push(rowData);
            });
        }
        return [{type: "table", header, body}];
    }
}

module.exports = TabularDataConverter;