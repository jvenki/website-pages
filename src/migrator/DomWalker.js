const cheerio = require("cheerio");
const winston = require("winston");
const Converter = require("./converter/TagConverterFactory");
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
        return {doc: this.docCreator.doc, status: this.docCreator.issues.length > 0 ? "WARNING" : "SUCCESS", issues: this.docCreator.issues};
    }

    handleCurrentElement() {
        const lastSection = this.docCreator.doc.sections.slice(-1).pop();
        const converter = Converter.for(this.$currElem, lastSection != undefined);

        winston.verbose(`\t\tProcessing Node with tagName='${this.$currElem.get(0).tagName}': Identified Converter as ${converter.getName()}: Element has classes '${this.$currElem.attr("class")}'`);

        const convertedElements = converter.convert(this.$currElem, this.$, this);

        if (converter.getName() == "NoopConverter") {
            return;
        }

        if (convertedElements == undefined) {
            this.docCreator.addIssue("Created an UNDEFINED element", this.$currElem);
            return;
        }

        convertedElements.forEach((convertedElement) => this.docCreator.add(convertedElement));
    }

    moveToNextElement() {
        this.$currElem = this.peekNextElement();
    }

    peekNextElement() {
        if (!this.$currElem) {
            return undefined;
        }
        
        const nextElement = this.$currElem.next();
        if (nextElement.length == 0) {
            return undefined;
        }
        return nextElement;
    }
}


module.exports = DomWalker;