import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

export default class TabularData extends React.Component {
    static propTypes = {
        header: PropTypes.arrayOf(PropTypes.string),
        body: PropTypes.arrayOf(PropTypes.array)
    }

    render() {
        return (
            <div className="hungry-table nb-table">
                <table className="table table-bordered table-striped">
                    {this.renderTableHeader()}
                    {this.renderTableBody()}
                </table>
            </div>
        );
    }

    renderTableHeader() {
        if (!this.props.header) {
            return null;
        }
        const row = <tr>{this.props.header.map((h, index) => <th key={index}>{h}</th>)}</tr>;
        return (<thead>{row}</thead>);
    }

    renderTableBody() {
        const rows = this.props.body.map((row, rowIndex) => <tr key={rowIndex}>{row.map((col, colIndex) => <td key={colIndex}>{toHTML(col)}</td>)}</tr>);
        return (<tbody>{rows}</tbody>);
    }
}