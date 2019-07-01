const BaseConverter = require("./BaseConverter");
const {assert, extractImgSrc} = require("./Utils");

class BannerConverter extends BaseConverter {
    _doPreValidate($element, $, walker) {
        assert($element.find("div.landing-banner-container").length == 1, "BannerConverter Condition Not Met #1");
        assert($element.find("div.landing-banner-container div.column-left img").length == 1, "BannerConverter Condition Not Met #2");
        assert($element.find("div.landing-banner-container div.column-right ul").length == 1, "BannerConverter Condition Not Met #3");
        assert($element.find("div.landing-banner-container div.column-right").children().length == 1, "BannerConverter Condition Not Met #4");
    }

    _doConvert($element, $, walker) {
        const imgSrc = extractImgSrc($element.find("div.landing-banner-container div.column-left img"));
        const features = $element.find("div.landing-banner-container div.column-right ul li").map((i, e) => {
            const iconClass = $(e).children().first().attr("class");
            const desc = $(e).children().last().text();
            return {iconClass, desc};
        }).get();

        return [{type: "banner", img: {src: imgSrc}, features}];
    }
}

module.exports = BannerConverter;