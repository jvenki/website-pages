const BaseConverter = require("./BaseConverter");

const headingDomElemTypes = ["h2", "h3", "h4", "h5", "strong"].sort();

class ReferencesConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        const items = [];
        let title = "";
        let $currElem = $element;
        if (headingDomElemTypes.includes($element.get(0).tagName)) {
            title = $element.text();
            $currElem = walker.peekNextElement();
            walker.moveToNextElement();
        }

        $currElem.find("a").each((i, a) => {
            items.push({title: $(a).text(), link: $(a).attr("href")});
        });
        return {type: "references", title, items};
    }
}

module.exports = ReferencesConverter;