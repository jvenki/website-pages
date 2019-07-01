const BaseConverter = require("./BaseConverter");

class SectionConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        return {type: "section", title: $element.text()};
    }
}

module.exports = SectionConverter;