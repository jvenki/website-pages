import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

export default class Grid extends React.Component {
    static propTypes = {
        body: PropTypes.string.isRequired,
    }

    render() {
        return toHTML(this.props.body);
    }
}