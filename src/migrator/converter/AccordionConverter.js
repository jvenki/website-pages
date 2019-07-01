const BaseConverter = require("./BaseConverter");
const {extractContentHtml} = require("./Utils");

class AccordionConverter extends BaseConverter {
    _doConvert($element, $, walker) {
        const items = [];
        if ($element.get(0).tagName == "details") {
            const title = $element.find("summary").text();
            const body = $element.find("summary").nextAll().map((i, b) => extractContentHtml($(b), this)).get().join("");
            items.push({title, body});
        } else {
            $element.find(".panel").each(function(i, panel) {
                const title = $(panel).find(".panel-heading h2").text();
                const body = extractContentHtml($(panel).find(".panel-body"), this);
                items.push({title, body});
            });
        }
        return [{type: "accordion", items}];
    }
}

module.exports = AccordionConverter;