const BaseConverter = require("./BaseConverter");
const {assert, extractContentHtml} = require("./Utils");

const textSupportedDomElemTypes = ["p", "ul", "ol", "li", "strong", "em"].sort();
const headingDomElemTypes = ["h3", "h4", "h5"].sort();

class TextConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        let title = "";
        let body = "";
        const elemType = $element.get(0).tagName;
        if (headingDomElemTypes.includes(elemType)) {
            title = $element.text();
        } else if (textSupportedDomElemTypes.includes(elemType)) {
            body += extractContentHtml($element, this);
        } else {
            assert(false, "TextConversion-ConditionNotMet for " + elemType, $element);
        }

        // Check whether it is followed by any other textual tags like P, UL, OL.
        while (true) {
            $element = walker.peekNextElement();
            if (!$element || !textSupportedDomElemTypes.includes($element.get(0).tagName)) {
                break;
            }
            walker.moveToNextElement();
            body += extractContentHtml($element, this);
        }
        return [{type: "text", title, body}];
    }
}

module.exports = TextConverter;