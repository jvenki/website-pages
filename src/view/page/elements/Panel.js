import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

export default class Panel extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired,
        body: PropTypes.string
    }

    render() {
        return (
            <div className="jumbotron">
                <h3 style={{textAlign: "center"}}>{this.props.title}</h3>
                {toHTML(this.props.body)}
            </div>
        );
    }
}