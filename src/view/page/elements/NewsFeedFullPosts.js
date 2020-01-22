import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

class Item extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired, 
        body: PropTypes.string.isRequired,
        postedBy: PropTypes.string,
        postedOn: PropTypes.string
    }

    render() {
        return (
            <React.Fragment>
                <h3 className="news-head">{this.props.title}</h3>
                {toHTML(this.props.body)}
                <div className="pull-right"> 
                    <p id="imglink"><img src="//www.bankbazaar.com/images/bb-logo-news-v1.png" alt=""/></p> 
                    <p><em>{this.props.postedOn}</em></p>
                </div>
                <div className="clearfix"></div>
            </React.Fragment>
        );
    }
}

export default class NewsFeedFullPosts extends React.Component {
    static propTypes = {
        items: PropTypes.arrayOf(PropTypes.shape())
    }

    render() {
        return (
            <div className="row news-widget">
                <ul>
                    {this.props.items.map((n, index) => <li key={index} className="news-green"><Item {...n}/></li>)}
                </ul>
            </div>
        );
    }
}