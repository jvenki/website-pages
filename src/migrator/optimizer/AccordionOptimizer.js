const BaseOptimizer = require("./BaseOptimizer");
const DomWalker = require("../DomWalker");
const {optimizeHtml, isPurelyTextual} = require("./Utils");
const flatten = require("lodash/flatten");

class AccordionOptimizer extends BaseOptimizer {
    optimize(element) {
        element.items.some((item) => {
            item.body = optimizeHtml(item.body);
        });
    }

    shouldTransformToSections(element) {
        return element.items.some((item) => !isPurelyTextual(item.body));
    }

    transformToSections(element, walker) {
        console.warn(DomWalker);
        const arrayOfArrays = element.items.map((item) => {
            const {doc, issues} = walker.againFor(item.body).executeFirstPass().finish();
            walker.docCreator.issues.push(...(issues || []));
            return doc.sections;
        });
        return flatten(arrayOfArrays);
    }
}

module.exports = AccordionOptimizer;