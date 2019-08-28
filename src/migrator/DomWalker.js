const cheerio = require("cheerio");
const winston = require("winston");
const DocCreator = require("./DocCreator");
const Converter = require("./tagConverter/TagConverterFactory");
const Optimizer = require("./optimizer/OptimizerFactory");
const MigrationError = require("./MigrationError");

class DomWalker {
    static for(html) {
        return new DomWalker(html);
    }

    againFor(html) {
        return new DomWalker(html);
    }

    constructor(html) {
        this.html = html;
        this.$ = cheerio.load(this.html, {decodeEntities: false});
        this.$currElem = undefined;
    }

    executeFirstPass() {
        winston.verbose("\tWalking our DOM...");
        const $firstElement = this.$("body").children().first();
        if ($firstElement.length == 0) {
            throw new MigrationError(MigrationError.Code.DOM_EMPTY);
        }

        this.docCreator = new DocCreator();
        
        this.$currElem = $firstElement;
        while (this.$currElem) {
            this.handleCurrentElement();
            this.moveToNextElement();
        }

        return this;
    }

    executeSecondPass() {
        const sections = this.docCreator.doc.sections;
        for (let i=0; i<sections.length; i++) {
            const currentSection = sections[i];
            winston.warn("Processing Section at Index = " + i  + " with title = " + currentSection.title);

            currentSection.elements.every((element, elementIndex) => {
                const optimizer = Optimizer.forElementOfType(element.type);
                optimizer.optimize(element);
                if (optimizer.shouldTransformToSections(element)) {
                    this.docCreator.addIssue("Migrating " + element.type + " to sections");
                    const sectionsNewlyCreated = optimizer.transformToSections(element, this);
                    sections.splice(i, 0, ...sectionsNewlyCreated);
                    winston.warn("Current Index = " + i + ": Newly Created Sections Length = " +  sectionsNewlyCreated.length + ": Next Section To Be Processed = " + sections[i+1].title);
                    sectionsNewlyCreated[sectionsNewlyCreated.length-1].elements.push(currentSection.elements.slice(elementIndex+1));
                    i += sectionsNewlyCreated.length-1;
                    return false;
                    //console.warn(JSON.stringify(sectionsNewlyCreated, null, 4));
                }
                return true;
            });
        }
        return this;
    }

    finish() {
        return {doc: this.docCreator.doc, status: this.docCreator.issues.length > 0 ? "WARNING" : "SUCCESS", issues: this.docCreator.issues};
    }

    handleCurrentElement() {
        const lastSection = this.docCreator.doc.sections.slice(-1).pop();
        const converter = Converter.forHTMLTag(this.$currElem, lastSection != undefined);

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