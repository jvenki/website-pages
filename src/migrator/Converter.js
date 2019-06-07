class Converter {
    toText($element, $) {
        let title = "";
        let body = "";
        if ($element.get(0).tagName == "h3") {
            title = $element.text();
        } else {
            body += "<p>" + $element.html() + "</p>";
        }

        // Check whether it is followed by any other textual tags like P.
        let $prev = $element;
        $element = $prev.next();
        while (true) {
            if ($element.get(0).tagName != "p") {
                break;
            }
            body += "<p>" + $element.html() + "</p>";
            $prev = $element;
            $element = $prev.next();
            $prev.remove();
        }

        return {type: "text", title, body};
    }

    toAccordion($element, $) {
        const panels = [];
        $element.find(".panel").each(function(i, panel) {
            const title = $(panel).find(".panel-heading h2").text();
            const body = $(panel).find(".panel-body").html();
            panels.push({title, body});
        });
        return {type: "accordion", panels: panels};
    }

    toBox($element, $) {
        const $titleBox = $element.children().eq(0);
        const $imgBox = $titleBox.find("img");
        const $bodyBox = $titleBox.nextAll("div");
    
        const title = $titleBox.find("h5 > a").text() || $titleBox.find("h5").text();
        const href = $titleBox.find("h5 > a").attr("href");
        const imgSrc = $imgBox.attr("data-original") || $imgBox.attr("src");
        const body = $bodyBox.html();

        return {type: "box", title, href, imgSrc, body};
    }

    toGrid($element, $) {
        return {type: "grid", body: $element.html()};
    }
}

module.exports = Converter;