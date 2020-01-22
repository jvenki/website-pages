import React from "react";
import PropTypes from "prop-types";

export default class CTA extends React.Component {
    static propTypes = {
        linkText: PropTypes.string.isRequired,
        link: PropTypes.string,
        prefix: PropTypes.string,
        suffix: PropTypes.string
    }

    render() {
        return (
            <div className="col-md-12 text-center">
                {this.props.prefix && 
                    <span>{this.props.prefix}</span>
                }
                <a title={this.props.linkText} className="btn btn-primary text-white" href={this.props.link}>{this.props.linkText}</a>
                {this.props.suffix && 
                    <span>{this.props.suffix}</span>
                }
            </div>
        );
    }
}