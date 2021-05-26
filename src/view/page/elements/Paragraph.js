import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

export default class Paragraph extends React.Component {
    static propTypes = {
        text: PropTypes.string.isRequired,
    }

    render() {
        return (
            <div>
                {toHTML(this.props.text)}
            </div>
        );
    }
}