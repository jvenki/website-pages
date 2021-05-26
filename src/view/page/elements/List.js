import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

export default class List extends React.Component {
    static propTypes = {
        items: PropTypes.array.isRequired,
        style: PropTypes.string
    }

    render() {
        const Tag = this.props.style == "ordered" ? "ol" : "ul"
        return (
            <Tag>
                {this.props.items.map((c, i) => <li key={i}>{toHTML(c.content)}</li>)}
            </Tag>
        );
    }
}