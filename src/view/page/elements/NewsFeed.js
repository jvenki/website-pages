import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

class Item extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired, 
        link: PropTypes.string.isRequired,
        img: PropTypes.shape({src: PropTypes.string})
    }

    render() {
        return (
            <a href={this.props.link} title={this.props.title} target="_blank">
                <img src={this.props.img.src} className="lazy" alt="" style={{display: "block", overflow: "hidden"}}/>
                <p>{this.props.title}</p>
                <span className="lp-more-details">Read more</span>
            </a>
        );
    }
}

export default class NewsFeed extends React.Component {
    static propTypes = {
        items: PropTypes.arrayOf(PropTypes.shape())
    }

    render() {
        return (
            <div className="row news-widget">
                <ul>
                    <li className="news-green">
                        <h2 className="news-head">Finance 101</h2>
                        <div className="lp-blog-post">
                            <ul className="clearfix">
                                {this.props.items.map((n, index) => <li key={index} className="col-xs-12 col-sm-6"><Item {...n}/></li>)}                                
                            </ul>
                        </div>
                        <div className="lp-blog-get-app">
                            <span className="app-title">Bankbazaar Apps</span>
                            <a href="https://bnkbzr.page.link/?ofl=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.bankbazaar.app&amp;apn=com.bankbazaar.app&amp;isi=972595507&amp;ibi=com.bankbazaar.app&amp;utm_campaign=home-page-banner&amp;utm_source=bb-website%24CROSS_SELL_TWI_CREDITSCORE_DSK%17ex683t2&amp;amv=162&amp;link=https%3A%2F%2Fwww.bankbazaar.com%3Futm_campaign%3Dhome-page-banner%26utm_source%3Dbb-website%2524CROSS_SELL_TWI_CREDITSCORE_DSK%2517ex683t2%26userIdentifierType%3DCDS_ID%26userIdentifier%3Dc84b7bf0-16a0-11ea-b75f-556204f45f36%26verificationToken%3Dad364aef-9118-4425-970c-02d721ac4fb7" title="Google play" data-name="MobileAppLink" target="_blank" class="app-sprite bbicons-android"></a>
                            <a href="https://itunes.apple.com/in/app/bankbazaar-loans-credit-cards/id972595507?mt=8&amp;ign-mpt=uo%3D4" title="Apple Store" target="_blank" className="app-sprite bbicons-ios"></a>
                        </div>
            
                    </li>
                </ul>
            </div>
        );
    }
}
