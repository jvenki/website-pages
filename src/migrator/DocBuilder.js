// @flow
import MigrationError, {ConversionIssueCode} from "./MigrationError";
import {omit, isEqual} from "lodash";

export default class DocBuilder {
    doc: Object;

    constructor() {
        this.doc = {title: "", body: "", sections: []};
    }

    add(item: Object) {
        switch (item.type) {
            case "section": this.addNewSectionWithTitle(item.title); break;
            case "disclaimer": this.addDisclaimer(item); break;
            case "references": this.addReferences(item); break;
            case "faq": this.addFAQ(item); break;
            default: this.addElement(item);
        }
    }

    addNewSectionWithTitle(title: string) {
        this.doc.sections.push({type: "section", title, body: "", elements: []});
    }
    
    addElement(element: Object) {
        let lastSection = this.doc.sections.slice(-1).pop();
        if (!lastSection) {
            this.addNewSectionWithTitle("");
            lastSection = this.doc.sections.slice(-1).pop();
        }
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

    lastSection() {
        return this.doc.sections.slice(-1).pop();
    }

    build() {
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