import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";
import cheerio from "cheerio";

export default class Table extends React.Component {
    static propTypes = {
        headers: PropTypes.array,
        rows: PropTypes.array,
        responsive: PropTypes.bool
    }

    render() {
        if (this.props.responsive) {
            const headerRows = this.props.headers.map((header, i) => {
                return (
                    <div key={i} className="tabular-data tabular-title">
                        {header.cols.map((col, j) => <div key={`${i}-${j}`} className="tabular-column">{toHTML(col.content)}</div>)}
                    </div>
                );
            });

            const bodyRows = this.props.rows.map((row, i) => {
                return (
                    <div key={i} className={`tabular-data ${i%2 == 1 ? "tb-priority" : ""}`}>
                        {row.cols.map((col, j) => <div key={`${i}-${j}`} className="tabular-column grid-col-1">{computeCellHtml(col.content)}</div>)}
                    </div>
                );
            });
            return (
                <div className="container">
                    <div className="tabular-section tb-pad-10">
                        {headerRows}
                        {bodyRows}
                    </div>
                </div>
            );
        } else {
            let rows = undefined;
            if (this.props.rows.length > 0) {
            rows = <tbody>{this.props.rows.map((row, i) => 
                <tr key={i} rowSpan={row.rowspan}>{row.cols.map((col, j) => {
                    let Tag = "td"
                    if (col.highlight) {
                        Tag = "th"
                    }
                    return <Tag key={`${i}-${j}`} rowSpan={col.rowSpan} colSpan={col.colspan}>{toHTML(col.content)}</Tag>;
                })}
                    </tr>)}
                </tbody>;
            }
            return <table>{rows}</table>;
        }
        
    }
}

const computeCellHtml = (col) => {
    const $ = cheerio.load(col, {decodeEntities: false});
    const rootElement = $("body").contents()[0];
    $(rootElement).find(">a").each((i, linkElem) => {
        const link = $(linkElem).attr("href");
        if (link && link.match(/variant=slide/)) {
            $(linkElem).attr("class", "btn btn-primary");
            $(linkElem).prepend("<span className=\"bbicons-flash\"></span>");
        }
    });
    return toHTML($(rootElement).html());
};