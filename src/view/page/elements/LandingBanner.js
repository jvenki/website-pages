import React from "react";
import PropTypes from "prop-types";

export default class LandingBanner extends React.Component {
    static propTypes = {
        img: PropTypes.shape({src: PropTypes.string, title: PropTypes.string}),
        linkText: PropTypes.string.isRequired,
        link: PropTypes.string,
        items: PropTypes.arrayOf(PropTypes.shape({text: PropTypes.string, icon: PropTypes.string})),
    }

    render() {
        return (
            <div className="bb-landing-banner">
                <div className="landing-banner-container">
                    <div className="column-left hide-on-mobile">
                        <img src={this.props.img.src} alt={this.props.img.title} title={this.props.img.title}/>
                    </div>
                    <div className="column-right">
                        <ul>
                            {this.props.items.map((item, i) => 
                                <li key={i}>
                                    <span className={`simplified-landing-banner-icons ${item.icon}`}></span>
                                    <span className="desc">{item.text}</span>
                                </li>
                            )}
                        </ul>
                        {this.props.link &&
                            <div className="cta-btn">
                                <a href={this.props.link} className="btn btn-lg text-center" title={this.props.linkText}>{this.props.linkText}</a>
                            </div>
                        }
                    </div>
                </div>
            </div>
        );
    }
}