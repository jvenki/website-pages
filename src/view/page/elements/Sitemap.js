import React from "react";
import PropTypes from "prop-types";

export default class Sitemap extends React.Component {
    static propTypes = {
        link: PropTypes.string.isRequired,
        linkText: PropTypes.string
    }

    render() {
        return (
            <div style={{textAlign: "right", backgroundColor: "#E0E000"}}>
                <a title={this.props.linkText} href={this.props.link}>{this.props.linkText || "SiteMap"}</a>
            </div>
        );
    }
}