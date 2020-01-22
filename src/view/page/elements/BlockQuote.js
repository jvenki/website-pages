import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

export default class BlockQuote extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired,
        body: PropTypes.string
    }

    render() {
        return (
            <blockquote className="bq-section col-md-12 clearfix">
                <h3>{this.props.title}</h3>
                {toHTML(this.props.body)}
            </blockquote>
        );
    }
}