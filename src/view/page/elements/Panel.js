import React from "react";
import PropTypes from "prop-types";

export default class Panel extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired,
        elements: PropTypes.array,
        createViewForElement: PropTypes.func.isRequired
    }

    render() {
        return (
            <div className="jumbotron">
                <h3 style={{textAlign: "center"}}>{this.props.title}</h3>
                {this.props.elements.map((e, i) => this.props.createViewForElement(e, i))}
            </div>
        );
    }
}