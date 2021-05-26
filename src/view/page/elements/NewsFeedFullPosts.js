import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

class Item extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired, 
        elements: PropTypes.array.isRequired,
        postedBy: PropTypes.string,
        updatedOn: PropTypes.string,
        createViewForElement: PropTypes.func.isRequired
    }

    render() {
        return (
            <React.Fragment>
                <h3 className="news-head">{this.props.title}</h3>
                {this.props.elements.map((e, i) => this.props.createViewForElement(e, i))}
                <div className="pull-right"> 
                    <p id="imglink"><img src="//www.bankbazaar.com/images/bb-logo-news-v1.png" alt=""/></p> 
                    <p><em>{this.props.updatedOn}</em></p>
                </div>
                <div className="clearfix"></div>
            </React.Fragment>
        );
    }
}

export default class NewsFeedFullPosts extends React.Component {
    static propTypes = {
        items: PropTypes.arrayOf(PropTypes.shape()),
        createViewForElement: PropTypes.func.isRequired,
    }

    render() {
        return (
            <div className="row news-widget">
                <ul>
                    {this.props.items.map((n, index) => <li key={index} className="news-green"><Item {...n} createViewForElement={createViewForElement} /></li>)}
                </ul>
            </div>
        );
    }
}