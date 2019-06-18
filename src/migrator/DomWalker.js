const cheerio = require("cheerio");
const winston = require("winston");
const Converter = require("./Converter");
const MigrationError = require("./MigrationError");


class DomWalker {
    static for(html) {
        return new DomWalker(html);
    }

    constructor(html) {
        this.html = html;
        this.$ = cheerio.load(this.html, {decodeEntities: false});
        this.$currElem = undefined;
    }

    forCreatingDoc(creator) {
        this.docCreator = creator;
        return this;
    }

    startWalking() {
        winston.verbose("\tWalking our DOM...");
        const $firstElement = this.$("body").children().first();
        if ($firstElement.length == 0) {
            throw new MigrationError(MigrationError.Code.DOM_EMPTY);
        }
        
        this.$currElem = $firstElement;
        while (this.$currElem) {
            this.handleCurrentElement();
            this.moveToNextElement();
        }
        return this.docCreator.doc;
    }

    handleCurrentElement() {
        const lastSection = this.docCreator.doc.sections.slice(-1).pop();
        const converter = Converter.for(this.$currElem, lastSection != undefined);

        winston.verbose(`\t\tProcessing Node with tagName='${this.$currElem.get(0).tagName}': Identified Converter as ${converter.getName()}: Element has classes '${this.$currElem.attr("class")}'`);

        switch (converter.getName()) {
            case "NoopConverter": 
                return;
            case "SectionConverter": 
                return this.docCreator.addNewSectionWithTitle(converter.convert(this.$currElem, this.$, this).title);
            case "DisclaimerConverter": 
                return this.docCreator.addDisclaimer(converter.convert(this.$currElem, this.$, this).link);
            case "ReferencesConverter": 
                return this.docCreator.addReferences(converter.convert(this.$currElem, this.$, this).links);
            case "FAQConverter": {
                const convertedFAQ = converter.convert(this.$currElem, this.$, this);
                if (this.docCreator.lastSection() && this.docCreator.lastSection().elements.length > 0) {
                    this.docCreator.addNewSectionWithTitle(convertedFAQ.title);
                }
                return this.docCreator.addElement(convertedFAQ);
            }
            default: 
                return this.docCreator.addElement(converter.convert(this.$currElem, this.$, this));
        }
    }

    moveToNextElement() {
        this.$currElem = this.peekNextElement();
    }

    peekNextElement() {
        const nextElement = this.$currElem.next();
        if (nextElement.length == 0) {
            return undefined;
        }
        return nextElement;
    }
}


module.exports = DomWalker;