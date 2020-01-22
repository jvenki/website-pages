import React from "react";
import PropTypes from "prop-types";

import {createViewForElement} from ".";

export default class Grid extends React.Component {
    static propTypes = {
        cells: PropTypes.array
    }

    render() {
        return (
            <div className="col-xs-12 col-sm-12 col-md-12">
                {this.props.cells.map((cell, index) => (
                    <div className={getGridClassesFromWidth(cell.width)} key={index}>
                        {createViewForElement(cell.body)}
                    </div>
                ))}
            </div>
        );
    }
}

const getGridClassesFromWidth = (widthPerc) => {
    const cellsCount = Math.round(parseFloat(widthPerc) * 12 / 100);
    return `col-xs-12 col-sm-${cellsCount} col-md-${cellsCount}`;
};