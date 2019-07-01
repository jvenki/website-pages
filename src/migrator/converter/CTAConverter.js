const BaseConverter = require("./BaseConverter");
const {assert} = require("./Utils");

class CTAConverter extends BaseConverter {
    _doPreValidate($element, $, walker) {
        if ($element.hasClass("link-section") || $element.hasClass("cta-section")) {
            // There are many documents which doesnt have Anchor Tag at all.
            // assert($element.find("a").length == 1, "CTAConverter-ConditionNotMet#1", $element);
        } else if ($element.hasClass("product-landing-btn-block")) {
            assert($element.children().length == 1, "CTAConverter-ConditionNotMet#2", $element);
            assert($element.find("div.link-section").length == 1, "CTAConverter-ConditionNotMet#3", $element);
            assert($element.find("div.link-section").children().length == 1, "CTAConverter-ConditionNotMet#4", $element);
            assert($element.find("div.link-section span").length == 1, "CTAConverter-ConditionNotMet#5", $element);
            assert($element.find("div.link-section span").children().length == 1, "CTAConverter-ConditionNotMet#6", $element);
            assert($element.find("div.link-section span a").length == 1, "CTAConverter-ConditionNotMet#7", $element);
        }
    }

    _doConvert($element, $, walker) {
        let linkText, link, promotion;
        if ($element.hasClass("link-section") || $element.hasClass("cta-section")) {
            if ($element.find("a").length == 0) {
                return undefined;
            }
            link = $element.find("a").first().attr("href");
            linkText = $element.find("a").first().text();
            promotion = {text: $element.text().replace(linkText, "").trim()};
        } else if ($element.hasClass("product-landing-btn-block")) {
            link = $element.find("a").attr("href");
            linkText = $element.find("a").text();
        } else if ($element.get(0).tagName == "a" || $element.hasClass("btn-primary")) {
            link = $element.attr("href");
            linkText = $element.text();
        }

        return [{type: "cta", link, linkText, promotion}];
    }
}

module.exports = CTAConverter;