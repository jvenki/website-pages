const cheerio = require("cheerio");
const chalk = require("chalk");
const Converter = require("./Converter");

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
        console.info(chalk.greenBright("Walking our DOM..."));
        const $firstElement = this.$("body").children().first();
        if ($firstElement.length == 0) {
            throw new Error("Something is wrong with the document. There is no child at all");
        }
        
        this.$currElem = $firstElement;
        while (this.$currElem) {
            console.info(chalk.gray(`\tProcessing Node with tagName='${this.$currElem.get(0).tagName}' and className='${this.$currElem.attr("class")}'`));
            this.handleCurrentElement();
            this.moveToNextElement();
        }
        return this.docCreator.doc;
    }

    handleCurrentElement() {
        const lastSection = this.docCreator.doc.sections.slice(-1).pop();
        const converter = Converter.for(this.$currElem, lastSection != undefined);

        switch (converter.getType()) {
            case "noop": return;
            case "section": return this.docCreator.addNewSection(converter.convert(this.$currElem, this.$, this));
            case "disclaimer": return this.docCreator.addDisclaimer(converter.convert(this.$currElem, this.$, this));
            case "references": return this.docCreator.addReferences(converter.convert(this.$currElem, this.$, this));
            default: return this.docCreator.addElement(converter.convert(this.$currElem, this.$, this));
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