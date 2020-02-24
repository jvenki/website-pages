import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";
import snakeCase from "lodash/snakeCase";

import Section from "./Section";
import FAQ from "./elements/FAQ";
import References from "./elements/References";
import Disclaimer from "./elements/Disclaimer";
import Sitemap from "./elements/Sitemap";
import NewsFeed from "./elements/NewsFeed";
import NewsFeedFullPosts from "./elements/NewsFeedFullPosts";


export default class Page extends React.Component {
    static propTypes = {
        doc: PropTypes.object
    }

    render() {
        return (
            <React.Fragment>
                {toHTML(this.props.doc.body || "")}
                {/* {this.getTableOfContents()} */}
                {(this.props.doc.sections || []).map((s, index) => <Section key={index} {...s}/>)}
                <div className="clearfix"></div>
                {this.props.doc.faq &&
                    <FAQ {...this.props.doc.faq}/>
                }
                {this.props.doc.references &&
                    <References references={this.props.doc.references}/>
                }
                {this.props.doc["news-feed"] &&
                    <NewsFeed {...this.props.doc["news-feed"]}/>
                }
                {this.props.doc["news-feed-full-posts"] &&
                    <NewsFeedFullPosts {...this.props.doc["news-feed-full-posts"]}/>
                }
                {this.props.doc.disclaimer &&
                    <Disclaimer {...this.props.doc.disclaimer}/>
                }
                {this.props.doc.sitemap &&
                    <Sitemap {...this.props.doc.sitemap}/>
                }
                <div className="clearfix"></div>
            </React.Fragment>
        );
    }

    getTableOfContents() {
        const sectionTitles = (this.props.doc.sections || []).map((s) => s.title);
        return (
            <table className="table table-curved" style={{margin: 0}}>
                <tbody>
                    <tr>
                        <td>
                            {sectionTitles.map((t, index) => <p key={snakeCase(t)}><a href={"#" + snakeCase(t)}>{t}</a></p>)}
                        </td>
                    </tr>
                </tbody>
            </table>
        );
    }
}