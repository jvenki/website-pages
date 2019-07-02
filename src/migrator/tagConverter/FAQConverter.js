const isEqual = require("lodash/isequal");
const BaseConverter = require("./BaseConverter");
const {assert, extractContentHtml, containsOnlyPaddingClasses} = require("./Utils");

class FAQConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        const title = $element.text();
        const items = [];
        const extractSingleQuestion = ($e) => {
            const qns = $e.find("summary").text();
            const ans = $e.find("summary").nextAll().map((i, a) => extractContentHtml($(a), this)).get().join("");
            return {question: qns, answer: ans};
        };

        const extractQuestionsGivenAsDetailsTagWithinContainer = ($e) => $e.find("details").each((i, d) => {items.push(extractSingleQuestion($(d)));});
        const extractQuestionsGivenAsSectionTagWithinContainer = ($e) => $e.find("section").each((i, d) => {items.push({question: $(d).find("strong").text(), answer: extractContentHtml($(d).find("div > div"), this)});});
        const extractQuestionsGivenAsOLTagWithinContainerCorrectHTML = ($e) => $e.find("> li").each((i, item) => {
            const question = $(item).find("strong").text();
            const answer = $(item).find("strong").nextAll().map((j, a) => extractContentHtml($(a), this)).get().join("");
            items.push({question, answer});
        });
        const extractQuestionsGivenAsOLTagWithinContainerWrongHTML = ($e) => $e.find(" > li").each((i, q) => {
            const question = $(q).text();
            // For some weird reason, nextUntil LI doesnt stop on the next LI
            // const answer = $(q).nextUntil("li").map((j, a) => $(a).html()).get().join("");
            const answer = [];
            $(q).nextAll().each((i, a) => {
                if (a.tagName == "li") return false; 
                answer.push(extractContentHtml($(a), this));
            });
            items.push({question, answer: answer.join("")});
        });
        const extractQuestionsGivenAsOLTagWithinContainer = ($e) => {
            const topLevelTagNamesUsed = $e.find(" > *").map((index, item) => item.tagName).get();
            if (isEqual([...new Set(topLevelTagNamesUsed)], ["li"])) {
                extractQuestionsGivenAsOLTagWithinContainerCorrectHTML($e);
            } else {
                extractQuestionsGivenAsOLTagWithinContainerWrongHTML($e);
            }
        };

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
        return [{type: "faq", title, items}];
    }
}

module.exports = FAQConverter;