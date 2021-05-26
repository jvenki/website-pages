import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

export default class Header extends React.Component {
    static propTypes = {
        text: PropTypes.string.isRequired,
        level: PropTypes.number.isRequired,
    }

    render() {
        const Tag = "h" + this.props.level;
        return (
            <Tag>
                {toHTML(this.props.text)}
            </Tag>
        );
    }
}