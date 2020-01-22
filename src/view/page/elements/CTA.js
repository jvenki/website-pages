import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

export default class CTA extends React.Component {
    static propTypes = {
        linkText: PropTypes.string.isRequired,
        link: PropTypes.string,
        prefix: PropTypes.string,
        suffix: PropTypes.string,
        title: PropTypes.string
    }

    render() {
        if (this.props.title) {
            return this.renderAsTable();
        } else if (this.props.prefix || this.props.suffix) {
            return this.renderAsText();
        }
        return this.renderAsButton();
    }

    renderAsText() {
        return (
            <div className="col-md-12 link-section">
                <p className="list-group-item list-group-blue"> 
                    {this.props.prefix &&  <span>{this.props.prefix}</span>}
                    <a title={this.props.linkText} href={this.props.link} style={{padding: "0 10px"}}>{this.props.linkText}</a>
                    {this.props.suffix && <span>{this.props.suffix}</span>}
                </p>
            </div>            
        );
    }

    renderAsButton() {
        return (
            <div className="col-md-12 text-center">
                <a title={this.props.linkText} className="btn btn-primary text-white" href={this.props.link}>{this.props.linkText}</a>
            </div>
        );
    }

    renderAsTable() {
        return (
            <div className="border-blue tabular-data col-md-12 btm-pad-10">
                <h3 className="lt-pad-10">{this.props.title}</h3>
                <div className="col-md-7">
                    {toHTML(this.props.prefix)}
                </div>
                <div className="col-md-4 text-center pad-10"><a className="btn text-white" href={this.props.link}>{this.props.linkText}</a></div>
            </div>
        );
    }
}