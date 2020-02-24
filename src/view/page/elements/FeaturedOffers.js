import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

export default class FeaturedOffers extends React.Component {
    static propTypes = {
        offers: PropTypes.arrayOf(PropTypes.shape({title: PropTypes.string, image: PropTypes.string, link: PropTypes.string, body: PropTypes.string}))
    }

    render() {
        const elements = this.props.offers.map((featuredOffer, i) => {
            return (
                <React.Fragment key={i}>
                    <div className="border-blue clearfix top-pad-10">
                        <div className="col-xs-12 col-md-4 text-center">
                            <h5><a href={featuredOffer.link} title={featuredOffer.title}><strong>{featuredOffer.title}</strong></a></h5>
                            <img title={featuredOffer.title} alt={featuredOffer.title} src={featuredOffer.img.src}/>
                            <div className="pad-10">
                                <a className="btn text-white" href="/credit-card.html?variant=slide">Check Eligibility</a>
                            </div>
                        </div>
                        <div className="col-xs-12 col-md-8">
                            <p></p>
                            {toHTML(featuredOffer.body)}
                            <p></p>
                        </div>
                    </div>
                    <br/>
                    <div className="clearfix"></div>
                </React.Fragment>
            );
        });

        return (
            <React.Fragment>
                {elements}
                {/* <div className="row btm-pad product-landing-btn-block">
                    <div className="col-md-12 link-section">
                        <span><a title="Credit Card Apply Online" href="/credit-card.html?variant=slide" className="animation-target">Apply for Credit Card</a></span>
                    </div>
                </div> */}
            </React.Fragment>
        );
    }
}