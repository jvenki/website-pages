import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";
import cheerio from "cheerio";

export default class ResponsiveTable extends React.Component {
    static propTypes = {
        body: PropTypes.string
    }

    render() {
        const $ = cheerio.load(this.props.body, {decodeEntities: false});
        const headerRows = $("table > thead > tr").map((i, tr) => {
            return (
                <div key={i} className="tabular-data tabular-title">
                    {$(tr).find(">th").map((j, th) => <div key={`${i}-${j}`} className="tabular-column">{$(th).text()}</div>).get()}
                </div>
            );
        }).get();

        const bodyRows = $("table > tbody > tr").map((i, tr) => {
            return (
                <div key={i} className="tabular-data">
                    {$(tr).find(">td").map((j, td) => <div key={`${i}-${j}`} className="tabular-column">{computeCellHtml($(td), $)}</div>).get()}
                </div>
            );
        }).get();

        return (
            <div className="tabular-section tb-pad-10">
                {headerRows}
                {bodyRows}
            </div>
        );
    }
}

const computeCellHtml = ($td, $) => {
    $td.find(">a").each((i, linkElem) => {
        const link = $(linkElem).attr("href");
        if (link && link.match(/variant=slide/)) {
            $(linkElem).attr("class", "btn btn-primary");
            $(linkElem).prepend("<span className=\"bbicons-flash\"></span>");
        }
    });
    return toHTML($td.html());
};