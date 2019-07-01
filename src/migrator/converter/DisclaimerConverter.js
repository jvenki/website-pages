const BaseConverter = require("./BaseConverter");
const {assert} = require("./Utils");

class DisclaimerConverter extends BaseConverter {
    _doPreValidate($element, $, walker) {
        assert($element.find("a").length == 1, "DisclaimerConversion-ConditionNotMet#1", $element);
        assert($element.find("*").length == 1, "DisclaimerConversion-ConditionNotMet#2", $element);
    }

    _doConvert($element, $, walker) {
        return {type: "diclaimer", link: $element.find("a").attr("href")};
    }
}

module.exports = DisclaimerConverter;