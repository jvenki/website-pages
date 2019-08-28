const difference = require("lodash/difference");
const cheerio = require("cheerio");
const winston = require("winston");

const textSupportedDomElemTypes = ["p", "ul", "ol", "li", "strong", "em", "a"].sort();

const optimizeHtml = (contentHtml, $e) => {
    const $ = cheerio.load(contentHtml, {decodeEntities: false});
    ["u", "div.link-section"].forEach((unwantedElementSelector) => {
        $(unwantedElementSelector).each((_, unwantedElement) => {
            const $unwantedElement = $(unwantedElement);
            $($unwantedElement.html()).insertAfter($unwantedElement); 
            $unwantedElement.remove();
        });
    });
    $("*").removeAttr("class");    
    return $("body").html();
};

const isPurelyTextual = (contentHtml) => {
    const $ = cheerio.load(contentHtml, {decodeEntities: false});
    const tagNamesUsedInsideBody = [...new Set($("body").find("*").map((_, e) => e.tagName).get())].sort();
    const unknownTagNamesUsed = difference(tagNamesUsedInsideBody, textSupportedDomElemTypes);

    if (unknownTagNamesUsed.length > 0) {
        winston.debug("Checking the HTML revealed the usage of non supported DOM Nodes - " + unknownTagNamesUsed + "\n" + contentHtml);
        return false;
    }
    return true;
};

module.exports = {optimizeHtml, isPurelyTextual};
