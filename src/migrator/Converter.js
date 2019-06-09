const textSupportedDomElemTypes = ["p", "ul", "ol", "strong"];

class Converter {
    static for($e) {
        const e = $e.get(0);
        if (e.tagName == "p" && $e.text() == "*Disclaimer") {
            return new DisclaimerConverter();
        } else if ([...textSupportedDomElemTypes, "h3"].includes(e.tagName)) {
            return new TextConverter();
        } else if ($e.hasClass("twi-accordion")) {
            return new AccordionConverter();
        } else if ($e.hasClass("jumbotron")) {
            return new JumbotronConverter();
        } else if ($e.hasClass("border-blue")) {
            return new BoxConverter();
        } else if (e.tagName == "div" && $e.attr("class") == "row") {
            return new GridConverter();
        } else if ($e.hasClass("product_interlink")) {
            return new ReferencesConverter();
        } else if ($e.get(0).tagName == "h2") {
            return new SectionConverter();
        } else if ($e.get(0).tagName == "br" || $e.hasClass("product-landing-btn-block")) {
            return new NoopConverter();
        } else if ($e.get(0).tagName == "div") {
            // We should NOT blindly support DIVs
            if ($e.hasClass("bb-products-invest")) {
                // LPD#859 uses this to showcase different types of CC. 
                return new NoopConverter();
            } else if ($e.find(".video-section").length > 0) {
                return new VideoConverter();
            }
        }

        throw new Error(`We dont know how to handle element tagName='${e.tagName} and class='${$e.attr("class")}'`);
    }

    getType() {}
    _doValidate() {}
    _doConvert($element, $, walker) {}

    convert($element, $, walker) {
        this._doValidate($element, $, walker);
        return this._doConvert($element, $, walker);
    }
}

class SectionConverter extends Converter {
    getType() {
        return "section";
    }

    _doConvert($element, $, walker) {
        return {title: $element.text(), mainBody: "", elements: []};
    }
}

class TextConverter extends Converter {
    getType() {
        return "text";
    }

    _doConvert($element, $, walker) {
        let title = "";
        let body = "";
        const elemType = $element.get(0).tagName;
        if (["h3"].includes(elemType)) {
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
    getType() {
        return "accordion";
    }

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
    getType() {
        return "jumbotron";
    }

    _doConvert($element, $, walker) {
        const title = $element.children().first().text();
        const body = $element.children().first().nextAll().map((i, e) => outerHtml($(e))).get().join("");
        return {type: "panel", title, body}
    }
}

class BoxConverter extends Converter {
    getType() {
        return "box";
    }

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
    getType() {
        return "grid";
    }

    _doConvert($element, $, walker) {
        return {type: "grid", body: outerHtml($element)};
    }
}

class ReferencesConverter extends Converter {
    getType() {
        return "references";
    }

    _doConvert($element, $, walker) {
        const links = [];
        $element.find("a").each((i, a) => {
            links.push({title: $(a).text(), link: $(a).attr("href")});
        });
        return links;
    }
}

class DisclaimerConverter extends Converter {
    getType() {
        return "disclaimer";
    }

    _doValidate($element, $, walker) {
        if ($element.find("a").length != 1) {
            throw new Error("I dont know how to handle the disclaimer without ANCHOR Tag");
        }
        if ($element.find("*").length != 1) {
            throw new Error("I dont know how to handle the disclaimer without ANCHOR Tag");
        }
    }

    _doConvert($element, $, walker) {
        return {link: $element.find("a").attr("href")};
    }
}

class VideoConverter extends Converter {
    getType() {
        return "video";
    }

    _doValidate($element, $, walker) {
        if ($element.find(".video-section").parent().children().length != 1) {
            console.warn("Element HTML =", $element.html());
            throw new Error("We expect only one child containing video-section");
        }
        if ($element.find(".video-section").children().length != 1) {
            throw new Error("We expect only one child under video-section");
        }
        if ($element.find(".video-section iframe").length != 1) {
            throw new Error("We expect IFRAME inside video-section");
        }
        if (!$element.find(".video-section iframe").attr("data-src")) {
            throw new Error("We expect data-src to be populated for the IFRAME under video-section");
        }
    }

    _doConvert($element, $, walker) {
        return {type: "video", link: $element.find(".video-section iframe").attr("data-src")}
    }
}

class NoopConverter extends Converter {
    getType() {
        return "noop";
    }
}

const outerHtml = ($e) => `<${$e.get(0).tagName}>${$e.html()}</${$e.get(0).tagName}>`;

module.exports = Converter;