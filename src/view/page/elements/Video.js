import React from "react";
import PropTypes from "prop-types";

export default class Video extends React.Component {
    static propTypes = {
        link: PropTypes.string.isRequired
    }

    render() {
        return (
            <div className="video-section"> 
                <iframe className="video-frame lazy-loaded" src={this.props.link} width="300" height="150" style={{width: 270, height: 150}}>
                </iframe> 
            </div>
        );
    }
}