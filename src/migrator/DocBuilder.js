// @flow
import MigrationError, {ConversionIssueCode} from "./MigrationError";
import {omit, isEqual} from "lodash";

export default class DocBuilder {
    doc: Object;
    toBePlacedInfographics: Object;
    toBePositionedFloat: Object;

    constructor() {
        this.doc = {title: "", body: "", sections: []};
    }

    add(item: Object) {
        switch (item.type) {
            case "section": this.addSection(item); break;
            case "disclaimer": this.addDisclaimer(item); break;
            case "references": this.addReferences(item); break;
            case "faq": this.addFAQ(item); break;
            case "sitemap": this.addSitemap(item); break;
            case "news-feed": this.addNewsFeed(item); break;
            case "news-feed-full-posts": this.addNewsFeedFullPosts(item); break;
            case "infographics": this.addInfographics(item); break;
            case "float": this.addFloatingElement(item); break;
            default: this.addElement(item);
        }
    }

    addSection(element: Object) {
        const newSection = {"type": "section", title: element.title, body: "", elements: []};
        this.doc.sections.push(newSection);
        handleToBePositionedFloatingElement(this);
    }
    
    addElement(element: Object) {
        let lastSection = this.doc.sections.slice(-1).pop();
        if (!lastSection) {
            this.addSection({title: ""});
            lastSection = this.doc.sections.slice(-1).pop();
        }
        handleToBePositionedFloatingElement(this);
        if (element.type == "text" && isPreviousElementInSectionAlsoText(lastSection)) {
            lastSection.elements[lastSection.elements.length-1].body += element.body;
        } else {
            lastSection.elements.push(element);
        }
    }
    
    addReferences(references: Object) {
        if (!this.doc.references) {
            this.doc.references = [];
        }
        this.doc.references.push(omit(references, ["type"]));
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
        if (this.doc.faq) {
            throw new MigrationError(ConversionIssueCode.MULTIPLE_FAQ);
        }
        this.doc.faq = omit(element, "type");
    }

    addSitemap(sitemap: Object) {
        if (this.doc.sitemap) {
            throw new MigrationError(ConversionIssueCode.MULTIPLE_SITEMAP);
        }
        this.doc.sitemap = omit(sitemap, ["type"]);
    }

    addNewsFeed(newsFeed: Object) {
        if (this.doc.newsFeed) {
            throw new MigrationError(ConversionIssueCode.MULTIPLE_NEWS_FEED);
        }
        this.doc["news-feed"] = omit(newsFeed, ["type"]);
    }

    addNewsFeedFullPosts(newsFeedFullPosts: Object) {
        if (this.doc.newsFeedFullPosts) {
            throw new MigrationError(ConversionIssueCode.MULTIPLE_NEWS_FEED_FULL_POSTS);
        }
        this.doc["news-feed-full-posts"] = omit(newsFeedFullPosts, ["type"]);
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