import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

export default class Text extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired,
        body: PropTypes.string
    }

    render() {
        return (
            <div>
                <h3>{this.props.title}</h3>
                {toHTML(this.props.body)}
            </div>
        );
    }
}