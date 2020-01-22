import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

export default class Disclaimer extends React.Component {
    static propTypes = {
        text: PropTypes.string,
        link: PropTypes.string,
        linkText: PropTypes.string
    }

    render() {
        if (this.props.link) {
            return (
                <p style={{textAlign: "right", fontSize: "11px", color: "#989898", lineHeight:"normal"}}>
                    *<a href={this.props.link}>{this.props.linkText}</a>
                </p>
            );
        }
        return (<div className="wc-disclaimer">{toHTML(this.props.text)}</div>);
    }
}