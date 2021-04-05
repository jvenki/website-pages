import React from "react";
import Text from "./Text";
import FeaturedOffers from "./FeaturedOffers";
import Video from "./Video";
import Panel from "./Panel";
import Accordion from "./Accordion";
import FAQ from "./FAQ";
import CTA from "./CTA";
import DeprecatedTOC from "./DeprecatedTOC";
import BlockQuote from "./BlockQuote";
import Grid from "./Grid";
import IFrame from "./IFrame";
import LandingBanner from "./LandingBanner";
import Table from "./Table";
import Infographics from "./Infographics";

const getViewKlassForElement = (element) => {
    switch (element.type) {
        case "text": return Text; 
        case "featured-offers": return FeaturedOffers;
        case "blockquote": return BlockQuote;
        case "video": return Video;
        case "iframe": return IFrame;
        case "panel": return Panel;
        case "accordion": return Accordion;
        case "grid": return Grid;
        case "table": return Table;
        case "faq": return FAQ;
        case "landing-banner": return LandingBanner;
        case "cta": return CTA;
        case "custom_toc": return DeprecatedTOC;
        case "infographics": return Infographics;
        case "image": return Infographics;
        default: return null;
    }
};

export const createViewForElement = (element, key) => {
    const ViewKlass = getViewKlassForElement(element);

    if (!ViewKlass) {
        return null;
    }

    return <ViewKlass {...element} key={key}/>;
};