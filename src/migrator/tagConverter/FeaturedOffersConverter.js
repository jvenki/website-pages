const BaseConverter = require("./BaseConverter");
const {extractContentHtml, extractImgSrc} = require("./Utils");

class FeaturedOffersConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        const extract = ($offerElement) => {
            const $titleBox = $offerElement.children().eq(0);
            const $imgBox = $titleBox.find("img");
            const $bodyBox = $titleBox.nextAll("div");
        
            const title = $titleBox.find("h5 > a").text() || $titleBox.find("h5").text();
            const link = $titleBox.find("h5 > a").attr("href");
            const imgSrc = extractImgSrc($imgBox);
            const body = extractContentHtml($bodyBox, this);
            return {title, link, img: {src: imgSrc}, body};
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

        return [{type: "featured-offers", offers}];
    }
}

module.exports = FeaturedOffersConverter;