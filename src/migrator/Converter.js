const textSupportedDomElemTypes = ["p", "ul", "ol", "strong"];
const containsOnlyGridClasses = ($element) => {
    let classNames = removePaddingClass($element.attr("class"));
    if (["row"].includes(classNames)) {
        return true;
    } else if (classNames.match(/col-md-\d+/)) {
        return true;
    }
    return false;
}

const containsOnlyPaddingClasses = ($element) => {
    return removePaddingClass($element.attr("class")) == "";
}

const removePaddingClass = (classNames) => {
    return classNames
        .replace(/btm-pad-\d+/, "").replace(/btm-pad/, "")
        .replace(/top-pad-\d+/, "").replace(/top-pad/, "")
        .replace(/pull-left/, "")
        .replace(/pull-right/, "")
        .trim();
}

class Converter {
    static for($e) {
        const e = $e.get(0);
        if (e.tagName == "p" && $e.text() == "*Disclaimer") {
            return new DisclaimerConverter();
        } else if ([...textSupportedDomElemTypes, "h3", "h4", "h5"].includes(e.tagName)) {
            return new TextConverter();
        } else if ($e.hasClass("twi-accordion")) {
            return new AccordionConverter();
        } else if ($e.hasClass("jumbotron")) {
            return new JumbotronConverter();
        } else if ($e.hasClass("border-blue")) {
            return new BoxConverter();
        } else if ($e.hasClass("lp-widget")) {
            return new WidgetConverter();
        } else if ($e.hasClass("bb-landing-banner")) {
            return new BannerConverter();
        } else if (e.tagName == "div" && $e.attr("class") == "row") {
            return new GridConverter();
        } else if ($e.hasClass("product_interlink")) {
            return new ReferencesConverter();
        } else if ($e.get(0).tagName == "h2") {
            return new SectionConverter();
        } else if ($e.get(0).tagName == "br" || $e.hasClass("product-landing-btn-block")) {
            return new NoopConverter();
        } else if ($e.hasClass("video-section")) {
            return new VideoConverter();
        } else if ($e.hasClass("tabular-section") || $e.hasClass("hungry-table") || $e.hasClass("table")) {
            return new TabularDataConverter();
        } else if ($e.hasClass("lp-banner")) {
            return new HighlightConverter();
        } else if ($e.hasClass("news-widget")) {
            return new FeaturedNewsConverter();
        } else if ($e.hasClass("tax-img-responsive") || $e.hasClass("pull-right")) {
            //TODO: Is it right to assume all pull-rights to be images
            return new ImageConverter();
        } else if ($e.get(0).tagName == "div") {
            // We should NOT blindly support DIVs
            if (containsOnlyGridClasses($e) || containsOnlyPaddingClasses($e)) {
                return new UnwrapConverter(Converter.for($e.children().first()));
            } else if ($e.hasClass("bb-products-invest")) {
                // LPD#859 uses this to showcase different types of CC. 
                return new NoopConverter();
            }
        }

        throw new Error(`We dont know how to handle element tagName='${e.tagName} and class='${$e.attr("class")}'` + $e.html());
    }

    _doValidate() {}
    _doConvert($element, $, walker) {}

    getName() {
        return this.constructor.name;
    }

    convert($element, $, walker) {
        this._doValidate($element, $, walker);
        return this._doConvert($element, $, walker);
    }
}

class SectionConverter extends Converter {
    _doConvert($element, $, walker) {
        return {type: "section", title: $element.text()};
    }
}

class TextConverter extends Converter {
    _doConvert($element, $, walker) {
        let title = "";
        let body = "";
        const elemType = $element.get(0).tagName;
        if (["h3", "h4", "h5"].includes(elemType)) {
            title = $element.text();
        } else if (textSupportedDomElemTypes.includes(elemType)) {
            body += outerHtml($element);
        } else {
            throw new Error(`I have got an DOM-Element of type ${elemType} which is not suitable to be handled as a Text Element`);
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

class AccordionConverter extends Converter {
    _doConvert($element, $, walker) {
        const panels = [];
        $element.find(".panel").each(function(i, panel) {
            const title = $(panel).find(".panel-heading h2").text();
            const body = $(panel).find(".panel-body").html();
            panels.push({title, body});
        });
        return {type: "accordion", panels: panels};
    }
}

class JumbotronConverter extends Converter {
    _doConvert($element, $, walker) {
        const title = $element.children().first().text();
        const body = $element.children().first().nextAll().map((i, e) => outerHtml($(e))).get().join("");
        return {type: "panel", title, body}
    }
}

class BoxConverter extends Converter {
    _doConvert($element, $, walker) {
        const $titleBox = $element.children().eq(0);
        const $imgBox = $titleBox.find("img");
        const $bodyBox = $titleBox.nextAll("div");
    
        const title = $titleBox.find("h5 > a").text() || $titleBox.find("h5").text();
        const href = $titleBox.find("h5 > a").attr("href");
        const imgSrc = $imgBox.attr("data-original") || $imgBox.attr("src");
        const body = $bodyBox.html();

        return {type: "box", title, href, imgSrc, body};
    }
}

class GridConverter extends Converter {
    _doConvert($element, $, walker) {
        return {type: "grid", body: outerHtml($element)};
    }
}

class ReferencesConverter extends Converter {
    _doConvert($element, $, walker) {
        const links = [];
        $element.find("a").each((i, a) => {
            links.push({title: $(a).text(), link: $(a).attr("href")});
        });
        return {type: "references", links};
    }
}

class DisclaimerConverter extends Converter {
    _doValidate($element, $, walker) {
        if ($element.find("a").length != 1) {
            throw new Error("I dont know how to handle the disclaimer without ANCHOR Tag");
        }
        if ($element.find("*").length != 1) {
            throw new Error("I dont know how to handle the disclaimer without ANCHOR Tag");
        }
    }

    _doConvert($element, $, walker) {
        return {type: "diclaimer", link: $element.find("a").attr("href")};
    }
}

class VideoConverter extends Converter {
    _doValidate($element, $, walker) {
        if ($element.children().length != 1) {
            throw new Error("We expect only one child under video-section");
        }
        if ($element.find("iframe").length != 1) {
            throw new Error("We expect IFRAME inside video-section");
        }
        if (!$element.find("iframe").attr("data-src")) {
            throw new Error("We expect data-src to be populated for the IFRAME under video-section");
        }
    }

    _doConvert($element, $, walker) {
        return {type: "video", link: $element.find("iframe").attr("data-src")}
    }
}

class NoopConverter extends Converter {
}

class UnwrapConverter extends Converter {
    constructor(innerConverter) {
        super();
        this.innerConverter = innerConverter;
    }

    getName() {
        return super.getName() + "->" + this.innerConverter.getName();
    }

    _doValidate($element, $, walker) {
        if ($element.children().length != 1) {
            throw new Error(`We expect only one child for things to be unwrapped. However there are ${$element.children().length} children found`);
        }
        //TODO: Check that it is made up of only GRID classes
    }

    _doConvert($element, $, walker) {
        return this.innerConverter.convert($element.children().first(), $, walker);
    }
}

class BannerConverter extends Converter {
    _doValidate($element, $, walker) {
        assert($element.find("div.landing-banner-container").length == 1, "BannerConverter Condition Not Met #1");
        assert($element.find("div.landing-banner-container div.column-left img").length == 1, "BannerConverter Condition Not Met #2");
        assert($element.find("div.landing-banner-container div.column-right ul").length == 1, "BannerConverter Condition Not Met #3");
        assert($element.find("div.landing-banner-container div.column-right").children().length == 1, "BannerConverter Condition Not Met #4");
    }

    _doConvert($element, $, walker) {
        const imgSrc = $element.find("div.landing-banner-container div.column-left img").attr("data-original") || $element.find("div.landing-banner-container div.column-left img").attr("src");
        const features = $element.find("div.landing-banner-container div.column-right ul li").map((i, e) => {
            const iconClass = $(e).children().first().attr("class");
            const desc = $(e).children().last().text();
            return {iconClass, desc};
        }).get();
        return {type: "banner", imgSrc, features};
    }
}

class ImageConverter extends Converter {
    _doConvert($element, $, walker) {
        //TODO: This still needs to be embedded within some TEXT element rather than as a separate element
        // Check https://stg1.bankbazaarinsurance.com/insurance/two-wheeler-insurance.html
        return {
            type: "section-image",
            src: $element.find("img").attr("data-original") || $element.find("img").attr("src"),
            placement: $element.hasClass("pull-right") ? "right" : "left",
            link: $element.find("a").attr("href")
        }
    }
}

class TabularDataConverter extends Converter {
    _doConvert($element, $, walker) {
        let header = [];
        let body = [];
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
                tbodyStartingIndex = 1;
                $headerRow = $element.find("tbody tr");
            } else {
                $headerRow = $element.find("thead tr");
            }
            header = ($headerRow.find("th").length > 0 ? $headerRow.find("th") : $headerRow.find("td")).map((i, h) => $(h).text()).get();
            $element.find("tr").each((i, row) => {
                if (i < tbodyStartingIndex) {
                    return true;
                }
                const rowData = $(row).find("td").map((j, col) => $(col).html()).get();
                body.push(rowData);
            })
        }
        return {type: "table", header, body};
    }
}

class WidgetConverter extends Converter {
    _doValidate($element, $, walker) {
    }

    _doConvert($element, $, walker) {
        const columnCount = computeColumnCount($element.find(".lp-widget-panel"));
        const panels = $element.find(".lp-widget-details").map((i, panel) => {
            const img = $(panel).find("img").attr("data-original") || $(panel).find("img").attr("src");
            const title = $(panel).find("strong").text();
            const body = $(panel).find("strong").nextUntil("a").map((i, e) => outerHtml($(e))).get();
            const link = $(panel).find("a").attr("href");
            return {img, title, body, link};
        }).get();
        return {type: "widget", panels};
    }
}

class HighlightConverter extends Converter {
    _doConvert($element, $, walker) {
        const link = $element.find("a").attr("href");
        const title = $element.find("strong").text();
        const img = $element.find("img").attr("data-original") || $element.find("img").attr("src");
        const body = $element.find("strong").nextAll().map((i, e) => outerHtml($(e))).get();
        return {type: "highlight", title, link, img, body};
    }
}

class FeaturedNewsConverter extends Converter {
    _doValidate($element, $, walker) {
        assert($element.find(" > ul > li").length == 1, "FeaturedNewsConverter condition not met #1");
    }

    _doConvert($element, $, walker) {
        const title = $element.find("h2").text();
        const columnCount = computeColumnCount($element.find("div.lp-blog-post > ul > li").first());
        const items = $element.find("div.lp-blog-post > ul > li").map((i, panel) => {
            const link = $(panel).find("a").attr("href");
            const img = $(panel).find("img").attr("data-original") || $(panel).find("img").attr("src");
            const body = $(panel).find("img").nextUntil("span.lp-more-details").map((i, e) => outerHtml($(e))).get();
        }).get();
        return {type: "featured-news", columnCount, items};
    }
}

const computeColumnCount = ($e) => {
    return 12;
}

const outerHtml = ($e) => `<${$e.get(0).tagName}>${$e.html()}</${$e.get(0).tagName}>`;

const assert = (condition, errorMsg) => {if (!condition) throw new Error(errorMsg)};

module.exports = Converter;