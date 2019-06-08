class DocCreator {
    constructor(args) {
        this.doc = {title: "", mainBody: "", sections: []};
    }

    addNewSection(section) {
        this.doc.sections.push(section);
    }
    
    addElement(element) {
        const lastSection = this.doc.sections.slice(-1).pop();
        if (lastSection) {
            lastSection.elements.push(element);
        } else {
            this.doc.mainBody += element.body;
        }
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