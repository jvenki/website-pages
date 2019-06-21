import React from "react";
import PropTypes from "prop-types";

export default class CTA extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired,
        link: PropTypes.string
    }

    render() {
        return (
            <div className="col-md-12 text-center">
                <a title={this.props.title} className="btn btn-primary text-white" href={this.props.link}>{this.props.title}</a>
            </div>
        );
    }
}