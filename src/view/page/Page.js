import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";
import snakeCase from "lodash/snakeCase";

import Section from "./Section";
import FAQ from "./elements/FAQ";
import References from "./elements/References";

export default class Page extends React.Component {
    static propTypes = {
        doc: PropTypes.object
    }

    render() {
        return (
            <React.Fragment>
                {toHTML(this.props.doc.body || "")}
                <div className="col-md-12 article-txt">
                    {/* {this.getTableOfContents()} */}
                    {(this.props.doc.sections || []).map((s, index) => <Section key={index} {...s}/>)}
                    {this.props.doc.faq &&
                        <FAQ {...this.props.doc.faq}/>
                    }
                    {this.props.doc.references &&
                        <References references={this.props.doc.references}/>
                    }
                    {this.props.doc.disclaimer &&
                        <div className="wc-disclaimer">{toHTML(this.props.doc.disclaimer.text)}</div>
                    }
                </div>
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