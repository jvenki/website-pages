class DocCreator {
    constructor(args) {
        this.doc = {title: "", mainBody: "", sections: []};
    }

    addNewSectionWithTitle(title) {
        this.doc.sections.push({type: "section", title, mainBody: "", elements: []});
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
            throw new Error("Only one references expected.. We already have one");
        }
        this.doc.references = references;
    }
    
    addDisclaimer(disclaimer) {
        if (this.doc.disclaimer) {
            throw new Error("Only one disclaimer expected.. We already have one");
        }
        this.doc.disclaimer = disclaimer;
    }
}

module.exports = DocCreator;