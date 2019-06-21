import React from "react";
import PropTypes from "prop-types";
import toHTML from "html-react-parser";

import Text from "./elements/Text";
import FeaturedOffers from "./elements/FeaturedOffers";
import Video from "./elements/Video";
import Panel from "./elements/Panel";
import Accordion from "./elements/Accordion";
import TabularData from "./elements/TabularData";
import BlockQuote from "./elements/Blockquote";
import FAQ from "./elements/FAQ";
import CTA from "./elements/CTA";
import Grid from "./elements/Grid";

export default class Section extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired,
        body: PropTypes.string,
        elements: PropTypes.array
    }

    render() {
        const elements = (this.props.elements || []).map((e, index) => createViewForElement(e));
        return (
            <React.Fragment>
                <h2>{this.props.title}</h2>
                {toHTML(this.props.body || "")}
                {elements}
            </React.Fragment>
        );
    }
}

const createViewForElement = (element) => {
    let ViewKlass;
    switch (element.type) {
        case "text": ViewKlass = Text; break;
        case "featured-offers": ViewKlass = FeaturedOffers; break;
        case "video": ViewKlass = Video; break;
        case "panel": ViewKlass = Panel; break;
        case "accordion": ViewKlass = Accordion; break;
        case "table": ViewKlass = TabularData; break;
        case "blockquote": ViewKlass = BlockQuote; break;
        case "faq": ViewKlass = FAQ; break;
        case "cta": ViewKlass = CTA; break;
        case "grid": ViewKlass = Grid; break;
    }

    if (!ViewKlass) {
        return null;
    }

    return <ViewKlass {...element}/>;
};