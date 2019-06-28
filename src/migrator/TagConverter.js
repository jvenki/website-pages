const MigrationError = require("./MigrationError");

const textSupportedDomElemTypes = ["p", "ul", "ol", "strong", "em"];
const headingDomElemTypes = ["h2", "h3", "h4", "h5"];

class TagConverter {
    static for($e) {
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
        } else if ($e.hasClass("twi-accordion") || $e.hasClass("ln-accordion")) {
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
        } else if ($e.hasClass("border-blue")) {
            return new FeaturedOffersConverter();
        } else if ($e.hasClass("bb-landing-banner")) {
            return new BannerConverter();
        } else if (e.tagName == "div" && isDivUnnecessary($e)) {
            return new UnwrapConverter();
        } else if (e.tagName == "div" && containsOnlyGridClasses($e)) {
            return new GridConverter();
        } else if ($e.get(0).tagName == "br") {
            return new NoopConverter();
        } else if (["h1", "details"].includes($e.get(0).tagName) || $e.hasClass("pointer-view") || $e.hasClass("product-landing-btn-block")) {
            return new NoopWarningConverter();
        } else if ($e.hasClass("video-section")) {
            return new VideoConverter();
        } else if ($e.hasClass("tabular-section") || $e.hasClass("hungry-table") || $e.hasClass("js-hungry-table") || $e.hasClass("table")) {
            return new TabularDataConverter();
        } else if ($e.get(0).tagName == "a" || $e.hasClass("btn-primary") || $e.hasClass("cta-section") || $e.hasClass("link-section")) {
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

    _doValidate() {/* Child Classes will define*/}
    _doConvert($element, $, walker) {/* Child Classes will define*/}

    getName() {
        return this.constructor.name;
    }

    convert($element, $, walker) {
        this._doValidate($element, $, walker);
        return this._doConvert($element, $, walker);
    }
}

class SectionConverter extends TagConverter {
    _doConvert($element, $, walker) {
        return {type: "section", title: $element.text()};
    }
}

class TextConverter extends TagConverter {
    _doConvert($element, $, walker) {
        let title = "";
        let body = "";
        const elemType = $element.get(0).tagName;
        if (headingDomElemTypes.includes(elemType)) {
            title = $element.text();
        } else if (textSupportedDomElemTypes.includes(elemType)) {
            body += outerHtml($element);
        } else {
            assert(false, "TextConversion-ConditionNotMet for " + elemType, outerHtml($element));
        }

        // Check whether it is followed by any other textual tags like P, UL, OL.
        while (true) {
            $element = walker.peekNextElement();
            if (!$element || !textSupportedDomElemTypes.includes($element.get(0).tagName)) {
                break;
            }
            walker.moveToNextElement();
            body += outerHtml($element);
        }
        return {type: "text", title, body};
    }
}

class AccordionConverter extends TagConverter {
    _doConvert($element, $, walker) {
        const items = [];
        $element.find(".panel").each(function(i, panel) {
            const title = $(panel).find(".panel-heading h2").text();
            const body = $(panel).find(".panel-body").html();
            items.push({title, body});
        });
        return {type: "accordion", items};
    }
}

class JumbotronConverter extends TagConverter {
    _doConvert($element, $, walker) {
        const title = $element.children().first().text();
        const body = $element.children().first().nextAll().map((i, e) => outerHtml($(e))).get().join("");
        return {type: "panel", title, body};
    }
}

class BlockQuoteConverter extends TagConverter {
    _doConvert($element, $, walker) {
        const title = $element.children().first().text();
        const body = $element.children().first().nextAll().map((i, e) => outerHtml($(e))).get().join("");
        return {type: "blockquote", title, body};
    }
}

class FeaturedOffersConverter extends TagConverter {
    _doConvert($element, $, walker) {
        const extract = ($offerElement) => {
            const $titleBox = $offerElement.children().eq(0);
            const $imgBox = $titleBox.find("img");
            const $bodyBox = $titleBox.nextAll("div");
        
            const title = $titleBox.find("h5 > a").text() || $titleBox.find("h5").text();
            const link = $titleBox.find("h5 > a").attr("href");
            const img = extractImgSrc($imgBox);
            const body = $bodyBox.html();
            return {title, link, img, body};
        };
        
        const offers = [extract($element)];

        while (true) {
            const $nextElement = walker.peekNextElement();
            if (!$nextElement) {
                break;
            }
            if ($nextElement.get(0).tagName == "br") {
                walker.moveToNextElement();
                continue;
            }
            if (!$nextElement.hasClass("border-blue")) {
                break;    
            }
            walker.moveToNextElement();
            offers.push(extract($nextElement));
        }

        return {type: "featured-offers", offers};
    }
}

class CTAConverter extends TagConverter {
    _doConvert($element, $, walker) {
        let body;
        if ($element.hasClass("link-section") || $element.hasClass("cta-section")) {
            // assert($element.find("a").length == 1, "CTAConverter-ConditionNotMet#1", $element);
            if ($element.find("a").length == 0) {
                return undefined;
            }

            body = $element.text().replace($element.find("a").text(), "").trim();
            $element = $element.find("a").first();
        }
        return {type: "cta", title: $element.text(), link: $element.attr("href"), body};
    }
}

class GridConverter extends TagConverter {
    _doConvert($element, $, walker) {
        return {type: "grid", body: outerHtml($element)};
    }
}

class ReferencesConverter extends TagConverter {
    _doConvert($element, $, walker) {
        const items = [];
        let title = "";
        let $currElem = $element;
        if ([...headingDomElemTypes, "strong"].includes($element.get(0).tagName)) {
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

class DisclaimerConverter extends TagConverter {
    _doValidate($element, $, walker) {
        assert($element.find("a").length == 1, "DisclaimerConversion-ConditionNotMet#1", $element);
        assert($element.find("*").length == 1, "DisclaimerConversion-ConditionNotMet#2", $element);
    }

    _doConvert($element, $, walker) {
        return {type: "diclaimer", link: $element.find("a").attr("href")};
    }
}

class VideoConverter extends TagConverter {
    _doValidate($element, $, walker) {
        assert($element.children().length == 1, "VideoConversion-ConditionNotMet#1", $element);
        assert($element.find("iframe").length == 1, "VideoConversion-ConditionNotMet#2", $element);
        assert(Boolean($element.find("iframe").attr("data-src") || $element.find("iframe").attr("src")), "VideoConversion-ConditionNotMet#3", $element);
    }

    _doConvert($element, $, walker) {
        return {type: "video", link: $element.find("iframe").attr("data-src") || $element.find("iframe").attr("src")};
    }
}

class NoopConverter extends TagConverter {
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

class UnwrapConverter extends TagConverter {
    _doConvert($element, $, walker) {
        const output = [];
        $element.children().each((i, child) => {
            output.push(TagConverter.for($(child)).convert($(child), $, walker));
        });
        return output;
    }
}

class BannerConverter extends TagConverter {
    _doValidate($element, $, walker) {
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
        return {type: "banner", imgSrc, features};
    }
}

class ImageConverter extends TagConverter {
    _doConvert($element, $, walker) {
        //TODO: This still needs to be embedded within some TEXT element rather than as a separate element
        // Check https://stg1.bankbazaarinsurance.com/insurance/two-wheeler-insurance.html
        return {
            type: "section-image",
            src: extractImgSrc($element.find("img")),
            placement: $element.hasClass("pull-right") ? "right" : "left",
            link: $element.find("a").attr("href")
        };
    }
}

class TabularDataConverter extends TagConverter {
    _doConvert($element, $, walker) {
        let header;
        const body = [];
        if ($element.hasClass("tabular-data")) {
            $element.find(".tabular-data").each((i, row) => {
                const $row = $(row);
                const rowData = [];
                $(row).find("div").each((i, col) => {
                    const $col = $(col);
                    rowData.push($col.html());
                });
                if ($row.hasClass("tabular-title")) {
                    header = rowData;
                } else {
                    body.push(rowData);
                }
            });
        } else {
            let tbodyStartingIndex = 0;
            let $headerRow;
            if ($element.find("thead").length == 0) {
                $headerRow = $element.find("tbody tr").first();
                if ($headerRow.find("td").length == 2) {
                    $headerRow = undefined;
                } else {
                    tbodyStartingIndex = 1;
                }
            } else {
                $headerRow = $element.find("thead tr");
            }
            if ($headerRow) {
                header = ($headerRow.find("th").length > 0 ? $headerRow.find("th") : $headerRow.find("td")).map((i, h) => $(h).text()).get();
            }
            $element.find("tr").each((i, row) => {
                if (i < tbodyStartingIndex) {
                    return true;
                }
                const rowData = $(row).find("td").map((j, col) => $(col).html()).get();
                body.push(rowData);
            });
        }
        return {type: "table", header, body};
    }
}

class WidgetConverter extends TagConverter {
    _doConvert($element, $, walker) {
        const columnCount = computeColumnCount($element.find(".lp-widget-panel"));
        const items = $element.find(".lp-widget-details").map((i, panel) => {
            const img = extractImgSrc($(panel).find("img"));
            const title = $(panel).find("strong").text();
            const body = $(panel).find("strong").nextUntil("a").map((i, e) => outerHtml($(e))).get();
            const link = $(panel).find("a").attr("href");
            return {img, title, body, link};
        }).get();
        return {type: "widget", items, columnCount};
    }
}

class HighlightConverter extends TagConverter {
    _doConvert($element, $, walker) {
        const link = $element.find("a").attr("href");
        const title = $element.find("strong").text();
        const img = extractImgSrc($element.find("img"));
        const body = $element.find("strong").nextAll().map((i, e) => outerHtml($(e))).get();
        return {type: "highlight", title, link, img, body};
    }
}

class FeaturedNewsConverter extends TagConverter {
    _doValidate($element, $, walker) {
        assert($element.find(" > ul > li").length == 1, "FeaturedNewsConverter condition not met #1");
    }

    _doConvert($element, $, walker) {
        const title = $element.find("h2").text();
        const columnCount = computeColumnCount($element.find("div.lp-blog-post > ul > li").first());
        const items = $element.find("div.lp-blog-post > ul > li").map((i, panel) => {
            const link = $(panel).find("a").attr("href");
            const img = extractImgSrc($(panel).find("img"));
            const body = $(panel).find("img").nextUntil("span.lp-more-details").map((i, e) => outerHtml($(e))).get();
            return {link, img, body};
        }).get();
        return {type: "featured-news", columnCount, title, items};
    }
}

class FAQConverter extends TagConverter {
    _doConvert($element, $, walker) {
        const title = $element.text();
        const items = [];
        const extractSingleQuestion = ($e) => {
            const qns = $e.find("summary").text();
            const ans = $e.find("summary").nextAll().map((i, a) => outerHtml($(a))).get().join("");
            return {question: qns, answer: ans};
        };

        const extractQuestionsGivenAsDetailsTagWithinContainer = ($e) => $e.find("details").each((i, d) => {items.push(extractSingleQuestion($(d)));});
        const extractQuestionsGivenAsSectionTagWithinContainer = ($e) => $e.find("section").each((i, d) => {items.push({question: $(d).find("strong").text(), answer: $(d).find("div > div").html()});});
        const extractQuestionsGivenAsOLTagWithinContainer = ($e) => $e.find(" > li").each((i, q) => {
            const question = $(q).text();
            // For some weird reason, nextUntil LI doesnt stop on the next LI
            // const answer = $(q).nextUntil("li").map((j, a) => $(a).html()).get().join("");
            const answer = [];
            $(q).nextAll().each((i, a) => {
                if (a.tagName == "li") return false; 
                answer.push($(a).html());
            });
            items.push({question, answer: answer.join("")});
        });

        const extractQuestionsGivenAsDetailsTagAtRootLevel = ($e) => {
            while (true) {
                const $nextElement = walker.peekNextElement();
                if (!$nextElement || $nextElement.get(0).tagName != "details") {
                    break;
                }
                walker.moveToNextElement();
                items.push(extractSingleQuestion($nextElement));
            }
        };

        const extractQuestionsGivenAsH3TagAtRootLevel = ($e) => {
            while (true) {
                const $questionElement = walker.peekNextElement();
                if (!$questionElement) {
                    break;
                }

                const $answerElement = $questionElement.next().length > 0 ? $questionElement.next() : $questionElement;
                if (!$questionElement || $questionElement.get(0).tagName != "h3" && $answerElement.get(0).tagName != "p") {
                    break;
                }
                walker.moveToNextElement();
                const question = $questionElement.text().replace(/^Q: /, "");
                walker.moveToNextElement();
                const answer = $answerElement.text().replace(/^A: /, "");
                items.push({question, answer});
            }
        };

        const extractQuestionsGivenAsPTagAtRootLevel = ($e) => {
            while (true) {
                const $questionElement = walker.peekNextElement();
                if (!$questionElement) {
                    break;
                }

                const $answerElement = $questionElement.next().length > 0 ? $questionElement.next() : $questionElement;
                if ($questionElement.get(0).tagName != "p" && $answerElement.get(0).tagName != "p" && $questionElement.children().first().get(0).tagName != "strong") {
                    break;
                }
                walker.moveToNextElement();
                const question = $questionElement.text().replace(/^Q: /, "");
                walker.moveToNextElement();
                const answer = $answerElement.text().replace(/^A: /, "");
                items.push({question, answer});
            }
        };

        if ($element.next().get(0).tagName == "div" && containsOnlyPaddingClasses($element.next())) {
            walker.moveToNextElement();
            extractQuestionsGivenAsDetailsTagWithinContainer($element.next());
            extractQuestionsGivenAsSectionTagWithinContainer($element.next());
        } else if ($element.next().get(0).tagName == "ol" || $element.next().get(0).tagName == "ul") {
            walker.moveToNextElement();
            extractQuestionsGivenAsOLTagWithinContainer($element.next());
        } else if ($element.next().get(0).tagName == "details") {
            extractQuestionsGivenAsDetailsTagAtRootLevel($element);
        } else if ($element.next().get(0).tagName == "h3") {
            extractQuestionsGivenAsH3TagAtRootLevel($element);
        } else if ($element.next().get(0).tagName == "p" && $element.next().children().first().get(0).tagName == "strong") {
            extractQuestionsGivenAsPTagAtRootLevel($element);
        } else {
            assert(false, "FAQConverter-ConditionNotMet#1", $element.next());
        }
        return {type: "faq", title, items};
    }
}

const isDivUnnecessary = ($e) => {
    //return containsOnlyGridClasses($e) || containsOnlyPaddingClasses($e);
    if (containsOnlyPaddingClasses($e) || containsOnlyPositioningClasses($e)) {
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

const containsOnlyPaddingClasses = ($element) => removePaddingClass($element.attr("class")) == "";
const containsOnlyPositioningClasses = ($element) => removePositioningClass($element.attr("class")) == "";

const removePaddingClass = (classNames) => {
    return (classNames || "")
        .replace(/lt-pad-\d+/, "").replace(/lt-pad/, "")
        .replace(/rt-pad-\d+/, "").replace(/rt-pad/, "")
        .replace(/btm-pad-\d+/, "").replace(/btm-pad/, "")
        .replace(/top-pad-\d+/, "").replace(/top-pad/, "")
        .replace(/pull-left/, "")
        .replace(/pull-right/, "")
        .trim();
};

const removePositioningClass = (classNames) => {
    return classNames
        .replace(/text-center/g, "")
        .replace(/text-right/g, "")
        .replace(/text-left/g, "")
        .trim();
};

const computeColumnCount = ($e) => undefined;
const outerHtml = ($e) => `<${$e.get(0).tagName}>${$e.html()}</${$e.get(0).tagName}>`;
const extractImgSrc = ($img) => $img.attr("data-original") || $img.attr("src");
const assert = (condition, errorMsg, $element) => {
    if (!condition) {
        throw new MigrationError(MigrationError.Code.UNKNOWN_TAG, errorMsg, outerHtml($element));
    }
};

module.exports = TagConverter;