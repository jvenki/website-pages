const textSupportedDomElemTypes = ["p", "ul", "ol", "strong"];

class Converter {
    identifyTypeOfElement($e) {
        const e = $e.get(0);
        if (e.tagName == "p" && $e.text() == "*Disclaimer") {
            return "disclaimer";
        } else if ([...textSupportedDomElemTypes, "h3"].includes(e.tagName)) {
            return "text";
        } else if ($e.hasClass("twi-accordion")) {
            return "accordion";
        } else if ($e.hasClass("border-blue")) {
            return "product-offer";
        } else if (e.tagName == "div" && $e.attr("class") == "row") {
            return "grid";
        } else if ($e.hasClass("product_interlink")) {
            return "references";
        } else if ($e.get(0).tagName == "h2") {
            return "section";
        } else {
            throw new Error(`We dont know how to handle element tagName='${e.tagName} and class='${$e.attr("class")}'`);
        }
    }

    toText($element, $, walker) {
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

    toAccordion($element, $, walker) {
        const panels = [];
        $element.find(".panel").each(function(i, panel) {
            const title = $(panel).find(".panel-heading h2").text();
            const body = $(panel).find(".panel-body").html();
            panels.push({title, body});
        });
        return {type: "accordion", panels: panels};
    }

    toBox($element, $, walker) {
        const $titleBox = $element.children().eq(0);
        const $imgBox = $titleBox.find("img");
        const $bodyBox = $titleBox.nextAll("div");
    
        const title = $titleBox.find("h5 > a").text() || $titleBox.find("h5").text();
        const href = $titleBox.find("h5 > a").attr("href");
        const imgSrc = $imgBox.attr("data-original") || $imgBox.attr("src");
        const body = $bodyBox.html();

        return {type: "box", title, href, imgSrc, body};
    }

    toGrid($element, $, walker) {
        return {type: "grid", body: outerHtml($element)};
    }

    toReference($element, $, walker) {
        const links = [];
        $element.find("a").each((i, a) => {
            links.push({title: $(a).text(), link: $(a).attr("href")});
        });
        return links;
    }

    toDisclaimer($element, $, walker) {
        if ($element.find("a").length == 1) {
            return {link: $element.find("a").attr("href")};
        } else {
            throw new Error("I dont know how to handle the disclaimer without ANCHOR Tag");
        }
    }
}

const outerHtml = ($e) => `<${$e.get(0).tagName}>${$e.html()}</${$e.get(0).tagName}>`;

module.exports = Converter;