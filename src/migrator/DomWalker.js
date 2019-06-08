const cheerio = require("cheerio");
const chalk = require("chalk");

class DomWalker {
    static for(html) {
        return new DomWalker(html);
    }

    constructor(html) {
        this.html = html;
        this.$ = cheerio.load(this.html, {decodeEntities: false});
        this.$currElem = undefined;
        this.finalDoc = {title: "", mainBody: "", sections: []};
    }

    withConverter(converter) {
        this.converter = converter;
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
        return this.finalDoc;
    }

    handleCurrentElement() {
        const type = this.converter.identifyTypeOfElement(this.$currElem);

        switch (type) {
            case "section": 
                addNewSectionToDoc(this.$currElem, this.$, this.finalDoc, this);
                break;
            case "disclaimer":
                addDisclaimerToDoc(this.$currElem, this.$, this.finalDoc, this.converter, this);
                break;
            case "references":
                addReferencesToDoc(this.$currElem, this.$, this.finalDoc, this.converter, this);
                break;
            default:
                const lastSection = this.finalDoc.sections.slice(-1).pop();
                if (!lastSection) {
                    addElementToMainBody(type, this.$currElem, this.$, this.finalDoc, this.converter, this);
                } else {
                    addElementToSection(type, this.$currElem, this.$, lastSection, this.converter, this);
                }
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

const addNewSectionToDoc = ($element, $, finalDoc, walker) => {
    const newSection = {title: $element.text(), mainBody: "", elements: []};
    finalDoc.sections.push(newSection);
}

const addElementToMainBody = (type, $element, $, finalDoc, converter, walker) => {
    let element;
    switch (type) {
        case "text": element = converter.toText($element, $, walker); break;
        case "grid": element = converter.toGrid($element, $, walker); break;
        default:
            throw new Error("We have not created a section yet and therefore we can expect only Textual Nodes till then. But we got " + type);
    }
    finalDoc.mainBody += element.body;
}

const addElementToSection = (type, $element, $, section, converter, walker) => {
    let element;
    switch (type) {
        case "text": element = converter.toText($element, $, walker); break;
        case "accordion": element = converter.toAccordion($element, $, walker); break;
        case "product-offer": element = converter.toBox($element, $, walker); break;
        default:
            throw new Error("No Converter defined for Element of type " + type);
    }
    section.elements.push(element);
}

const addReferencesToDoc = ($element, $, finalDoc, converter, walker) => {
    if (finalDoc.references) {
        throw new Error("Only one references expected.. We already have one");
    }
    finalDoc.references = converter.toReference($element, $, walker);
}

const addDisclaimerToDoc = ($element, $, finalDoc, converter, walker) => {
    if (finalDoc.disclaimer) {
        throw new Error("Only one disclaimer expected.. We already have one");
    }
    finalDoc.disclaimer = converter.toDisclaimer($element, $, walker);
}

module.exports = DomWalker;