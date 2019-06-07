const cheerio = require("cheerio");
const chalk = require("chalk");
const Cleanser = require("./Cleanser");
const Converter = require("./Converter");

class TreeWalker {
    walk(title, html) {
        const cleansedHtml = this._cleanse(html);
        const converter = new Converter();

        const finalDoc = {title: title, mainBody: "", sections: []};

        const $ = cheerio.load(cleansedHtml, {decodeEntities: false});
        const firstElement = $("body").children().first();
        if (firstElement.length == 0) {
            throw new Error("Something is wrong with the document. There is no child at all");
        }
        
        let currentElement = firstElement.get(0);
        let currentSection;
        while (true) {
            // console.info(`Processing Node with tagName='${currentElement.tagName}' and className='${$(currentElement).attr("class")}'`);
            const $currentElement = $(currentElement);
            if (currentElement.tagName == "h2") {
                currentSection = this._createEmptySection($currentElement, $, finalDoc);
            } else if (!currentSection) {
                this._addElementToMainBody($currentElement, $, finalDoc, converter);
            } else {
                this._addElementToSection($currentElement, $, currentSection, converter);
            }

            if ($currentElement.next().length == 0) {
                break;
            }
            currentElement = $currentElement.next().get(0);
        }
        return finalDoc;
    }

    _addElementToMainBody($element, $, finalDoc, converter) {
        const type = this._identifyTypeOfElement($element);
        let element;
        switch (type) {
            case "text": element = converter.toText($element, $); break;
            case "grid": element = converter.toText($element, $); break;
            default:
                throw new Error("We have not created a section yet and therefore we can expect only Textual Nodes till then. But we got " + type);
        }
        finalDoc.mainBody += element.body;
    }

    _createEmptySection($element, $, finalDoc) {
        const newSection = {title: $element.text(), mainBody: "", elements: []};
        finalDoc.sections.push(newSection);
        return newSection;
    }

    _addElementToSection($element, $, section, converter) {
        const type = this._identifyTypeOfElement($element);
        let element;
        switch (type) {
            case "text": element = converter.toText($element, $); break;
            case "accordion": element = converter.toAccordion($element, $); break;
            case "product-offer": element = converter.toBox($element, $); break;
        }
        section.elements.push(element);
    }

    _cleanse(html) {
        return new Cleanser().cleanse(html);
    }

    _identifyTypeOfElement($e) {
        const e = $e.get(0);
        if (["p", "ul", "ol"].includes(e.tagName)) {
            return "text";
        } else if (e.tagName == "h3") {
            return "text";
        } else if ($e.hasClass("twi-accordion")) {
            return "accordion";
        } else if ($e.hasClass("border-blue")) {
            return "product-offer";
        } else  if (e.tagName == "div" && $e.attr("class") == "row") {
            return "grid";
        }
    }
}

module.exports = TreeWalker;