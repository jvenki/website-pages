import React from "react";
import PropTypes from "prop-types";

export default class Video extends React.Component {
    static propTypes = {
        link: PropTypes.string.isRequired
    }

    render() {
        return (
            <iframe src={this.props.link} scrolling="yes" frameBorder="0" marginHeight="0px" marginWidth="0px" allowFullScreen="" style={{border: "0px none rgb(255, 255, 255)", width: "100%", height: "440px"}}>
            </iframe>
        );
    }
}