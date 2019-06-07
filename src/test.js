const cheerio = require("cheerio");

const sampleHtml = '\
<h2>Section Title 1</h2>\
<p>This is some sample para 1</p>\
<h3>Sub Section Title 1.1</h3>\
<p>This is some sample para 1.1</p>\
<h3>Sub Section Title 1.2</h3>\
<p>This is some sample para 1.2</p>\
<h2>Section Title 2</h2>\
<div class="accordion"><div class="title">Accordion Panel Title 1</div><div class="body">Accordion Panel Body 1</div></div>\
<div><h2>Section Title 3</h2></div>\
<div><div><h2>Section Title 4</h2></div></div>\
';

const $ = cheerio.load(sampleHtml);
$("body").children().each(function(i, e) {
    console.log(e.tagName);
    if (e.tagName == "h2") {
        $(e).nextUntil("h2").each(function(i, s) {
            console.log("Found Siblings like ", s.tagName);
        });
    }
}); 1;


let currentElement = $("body").children().first().get(0);
while (currentElement.tagName) {
    console.log(currentElement.tagName);
    if (currentElement.tagName == "h2") {
        $(currentElement).nextUntil("h2").each(function(i, s) {
            if (s.tagName == "p") {
                console.log("Deleting Siblings like ", s.tagName);
                $(s).remove();
            }
        });
    }
    if ($(currentElement).next().length == 0) {
        break;
    }
    currentElement = $(currentElement).next().get()[0];
}
