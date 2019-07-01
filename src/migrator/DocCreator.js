const MigrationError = require("./MigrationError");

class DocCreator {
    constructor(args) {
        this.doc = {title: "", body: "", sections: []};
        this.issues = [];
    }

    add(item) {
        switch (item.type) {
            case "section": this.addNewSectionWithTitle(item.title); break;
            case "disclaimer": this.addDisclaimer(item.link); break;
            case "references": this.addReferences(item); break;
            case "faq": this.addFAQ(item); break;
            default: this.addElement(item);
        }
    }

    addNewSectionWithTitle(title) {
        this.doc.sections.push({type: "section", title, body: "", elements: []});
    }
    
    addElement(element) {
        let lastSection = this.doc.sections.slice(-1).pop();
        if (!lastSection) {
            this.addNewSectionWithTitle("");
            lastSection = this.doc.sections.slice(-1).pop();
        }
        lastSection.elements.push(element);
    }
    
    addReferences(references) {
        if (this.doc.references) {
            throw new MigrationError(MigrationError.Code.MULTIPLE_REFERENCES);
        }
        this.doc.references = references;
    }
    
    addDisclaimer(disclaimer) {
        if (this.doc.disclaimer) {
            throw new MigrationError(MigrationError.Code.MULTIPLE_DISCLAIMER);
        }
        this.doc.disclaimer = disclaimer;
    }

    addFAQ(element) {
        if (this.doc.faq) {
            throw new MigrationError(MigrationError.Code.MULTIPLE_FAQ);
        }
        this.doc.faq = element;
    }

    lastSection() {
        return this.doc.sections.slice(-1).pop();
    }

    addIssue(issue, $e) {
        this.issues.push({issue, html: `<${$e.get(0).tagName} class='${$e.attr("class")}'>${$e.html()}</${$e.get(0).tagName}>`});
    }
}

module.exports = DocCreator;