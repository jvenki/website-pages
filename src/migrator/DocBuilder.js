// @flow
import MigrationError, {ConversionIssueCode} from "./MigrationError";
import {omit, isEqual} from "lodash";

export default class DocBuilder {
    doc: Object;
    toBePlacedInfographics: Object;
    toBePositionedFloat: Object;

    constructor() {
        this.doc = {title: "", hungryForMore: []};
    }

    add(item: Object) {
        switch (item.type) {
            case "disclaimer": this.addDisclaimer(item); break;
            case "faq": this.addFAQ(item); break;
            case "sitemap": this.addSitemap(item); break;
            case "news-feed": this.addNewsFeed(item); break;
            case "news-feed-full-posts": this.addNewsFeedFullPosts(item); break;
            case "infographics": this.addInfographics(item); break;
            case "float": this.addFloatingElement(item); break;
            default: this.addElement(item);
        }
    }
    
    addElement(element: Object) {
        handleToBePositionedFloatingElement(this);
        this.doc.hungryForMore.push(element);
    }
    
    addDisclaimer(disclaimer: Object) {
        disclaimer = omit(disclaimer, ["type"]);
        if (this.doc.disclaimer) {
            if (!isEqual(this.doc.disclaimer, disclaimer)) {
                throw new MigrationError(ConversionIssueCode.MULTIPLE_DISCLAIMER);
            }
            return;
        }
        this.doc.disclaimer = disclaimer;
    }

    addFAQ(element: Object) {
        if (this.doc.faqs) {
            throw new MigrationError(ConversionIssueCode.MULTIPLE_FAQ);
        }
        this.doc.faqs = omit(element, "type");
    }

    addSitemap(sitemap: Object) {
        if (this.doc.sitemap) {
            throw new MigrationError(ConversionIssueCode.MULTIPLE_SITEMAP);
        }
        this.doc.sitemap = omit(sitemap, ["type"]);
    }

    addNewsFeed(newsFeed: Object) {
        if (this.doc.finance101) {
            throw new MigrationError(ConversionIssueCode.MULTIPLE_NEWS_FEED);
        }
        this.doc["finance101"] = omit(newsFeed, ["type"]);
    }

    addNewsFeedFullPosts(newsFeedFullPosts: Object) {
        if (this.doc.news) {
            throw new MigrationError(ConversionIssueCode.MULTIPLE_NEWS_FEED_FULL_POSTS);
        }
        this.doc["news"] = omit(newsFeedFullPosts, ["type"]);
    }

    addInfographics(element: Object) {
        this.toBePlacedInfographics = element;
    }

    addFloatingElement(element: Object) {
        this.toBePositionedFloat = element;
    }

    lastSection() {
        return this.doc.sections.slice(-1).pop();
    }

    build() {
        if (this.toBePositionedFloat) {
            throw new Error("Temp Info Graphics is yet to be positioned");
        }
        return this.doc;
    }
}

const isPreviousElementInSectionAlsoText = (section) => {
    if (section.elements.length == 0) {
        return false;
    }
    if (section.elements[section.elements.length-1].type != "text") {
        return false;
    }
    return true;
};

const handleToBePositionedFloatingElement = (builder) => {
    const float = builder.toBePositionedFloat;
    builder.toBePositionedFloat = undefined;
    if (!float) {
        return;
    }
    builder.addElement(float.actualElement);
};