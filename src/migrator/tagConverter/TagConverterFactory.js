const BaseConverter = require("./BaseConverter");
const SectionConverter = require("./SectionConverter");
const TextConverter = require("./TextConverter");
const AccordionConverter = require("./AccordionConverter");
const BannerConverter = require("./BannerConverter");
const VideoConverter = require("./VideoConverter");
const TabularDataConverter = require("./TabularDataConverter");
const CTAConverter = require("./CTAConverter");
const FeaturedOffersConverter = require("./FeaturedOffersConverter");
const FeaturedNewsConverter = require("./FeaturedNewsConverter");
const {JumbotronConverter, BlockQuoteConverter, HighlightConverter, WidgetConverter} = require("./PanelConverter");
const DisclaimerConverter = require("./DisclaimerConverter");
const FAQConverter = require("./FAQConverter");
const ReferencesConverter = require("./ReferencesConverter");
const {removePaddingClass, removePositioningClass, containsOnlyPaddingClasses, containsOnlyPositioningClasses, assert, extractImgSrc} = require("./Utils");

const textSupportedDomElemTypes = ["p", "ul", "ol", "li", "strong", "em"].sort();
const headingDomElemTypes = ["h2", "h3", "h4", "h5"].sort();

class ConverterFactory {
    static forHTMLTag($e) {
        const e = $e.get(0);
        if (e.tagName == "p" && $e.text() == "*Disclaimer") {
            return new DisclaimerConverter();
        } else if (headingDomElemTypes.includes(e.tagName) && ($e.text().includes("Frequently Asked Questions") || $e.text().includes("FAQ"))) {
            return new FAQConverter();
        } else if ($e.hasClass("product_interlink") || $e.hasClass("product-interlinks") || ([...headingDomElemTypes, "strong"].includes(e.tagName) && $e.text().match(/other.*product.*|related.*product.*|other.*top.*credit.*/i))) {
            //TODO: Check the way it has been done for ID#4. We need to check for H2 Title also
            return new ReferencesConverter();
        } else if (e.tagName == "h2") {
            return new SectionConverter();
        } else if ([...textSupportedDomElemTypes, ...headingDomElemTypes].includes(e.tagName)) {
            return new TextConverter();
        } else if ($e.hasClass("twi-accordion") || $e.hasClass("ln-accordion") || $e.get(0).tagName == "details") {
            return new AccordionConverter();
        } else if ($e.hasClass("jumbotron")) {
            return new JumbotronConverter();
        } else if (e.tagName == "blockquote") {
            return new BlockQuoteConverter();
        } else if ($e.hasClass("lp-banner")) {
            return new HighlightConverter();
        } else if ($e.hasClass("news-widget")) {
            return new FeaturedNewsConverter();
        } else if ($e.hasClass("lp-widget")) {
            return new WidgetConverter();
        } else if ($e.get(0).tagName == "div" && $e.hasClass("border-blue")) {
            return new FeaturedOffersConverter();
        } else if ($e.hasClass("bb-landing-banner")) {
            return new BannerConverter();
        } else if (e.tagName == "div" && isDivUnnecessary($e)) {
            return new UnwrapConverter();
        } else if (e.tagName == "div" && containsOnlyGridClasses($e)) {
            return new GridConverter();
        } else if ($e.get(0).tagName == "br") {
            return new NoopConverter();
        } else if (["h1"].includes($e.get(0).tagName) || $e.hasClass("pointer-view")) {
            return new NoopWarningConverter();
        } else if ($e.hasClass("video-section")) {
            return new VideoConverter();
        } else if ($e.hasClass("tabular-section") || $e.hasClass("hungry-table") || $e.hasClass("js-hungry-table") || $e.hasClass("table")) {
            return new TabularDataConverter();
        } else if ($e.get(0).tagName == "a" || $e.hasClass("btn-primary") || $e.hasClass("cta-section") || $e.hasClass("link-section") || $e.hasClass("product-landing-btn-block")) {
            return new CTAConverter();
        } else if ($e.hasClass("tax-img-responsive") || $e.hasClass("pull-right")) {
            //TODO: Is it right to assume all pull-rights to be images
            return new ImageConverter();
        } else if ($e.get(0).tagName == "div") {
            // We should NOT blindly support DIVs
            if ($e.hasClass("bb-products-invest")) {
                // LPD#859 uses this to showcase different types of CC. 
                return new NoopConverter();
            }
        }
        assert(false, `IdentifyConverterFor ${e.tagName}${$e.attr("class") ? "." + $e.attr("class").replace(/ /g, ".") : ""}`, $e);
    }
}

class GridConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        return [{type: "grid", body: `<${$element.get(0).tagName}>${$element.html()}</${$element.get(0).tagName}>`}];
    }
}

class ImageConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        //TODO: This still needs to be embedded within some TEXT element rather than as a separate element
        // Check https://stg1.bankbazaarinsurance.com/insurance/two-wheeler-insurance.html
        return [{
            type: "section-image",
            src: extractImgSrc($element.find("img")),
            placement: $element.hasClass("pull-right") ? "right" : "left",
            link: $element.find("a").attr("href")
        }];
    }
}

class NoopConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        return undefined;
    }
}

class NoopWarningConverter extends NoopConverter {
    _doConvert($element, $, walker) {
        if ($element.hasClass("pointer-view")) {
            walker.moveToNextElement();
        }
        return undefined;
    }
}

class UnwrapConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        const output = [];
        $element.children().each((i, child) => {
            const childConverted = ConverterFactory.forHTMLTag($(child)).convert($(child), $, walker);
            if (childConverted) {
                output.push(...childConverted);
            }
        });
        return output;
    }
}

const isDivUnnecessary = ($e) => {
    //return containsOnlyGridClasses($e) || containsOnlyPaddingClasses($e);
    if (containsOnlyPaddingClasses($e) || containsOnlyPositioningClasses($e)) {
        return true;
    } else if (containsOnlyGridClasses($e) && $e.children().length == 1) {
        // Looks like there is just one child within the Grid styled DIV. Why?
        return true;
    }
    return false;
};

const containsOnlyGridClasses = ($element) => {
    const classNames = removePositioningClass(removePaddingClass($element.attr("class")));
    if (["row"].includes(classNames)) {
        return true;
    } else if (classNames.match(/^((?:col-xs-\d+\s*|col-sm-\d+\s*|col-md-\d+\s*|col-lg-\d+\s*)+)$/)) {
        // Refer https://www.regular-expressions.info/captureall.html on why we need ?: before
        return true;
    }
    return false;
};


module.exports = ConverterFactory;