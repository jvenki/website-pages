const BaseConverter = require("./BaseConverter");
const {assert} = require("./Utils");

class VideoConverter extends BaseConverter {
    _doPreValidate($element, $, walker) {
        assert($element.children().length == 1, "VideoConversion-ConditionNotMet#1", $element);
        assert($element.find("iframe").length == 1, "VideoConversion-ConditionNotMet#2", $element);
        assert(Boolean($element.find("iframe").attr("data-src") || $element.find("iframe").attr("src")), "VideoConversion-ConditionNotMet#3", $element);
    }

    _doConvert($element, $, walker) {
        return [{type: "video", link: $element.find("iframe").attr("data-src") || $element.find("iframe").attr("src")}];
    }
}

module.exports = VideoConverter;