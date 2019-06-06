const mysql = require("mysql");
const parseString = require("xml2js").parseString;
const cheerio = require("cheerio");
const minify = require('html-minifier').minify;
const pretty = require('pretty');
const chalk = require("chalk");

class Converter {
    toText($element, $) {
        let title = "";
        let body = "";
        if ($element.get().tagName == "h3") {
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
}

class Parser {
    parseAndConvert(html, title) {
        const cleansedHtml = this.cleanse(html);
        const converter = new Converter();

        const finalDoc = {title: title, mainBody: "", sections: []};

        const $ = cheerio.load(cleansedHtml, {decodeEntities: false});

        let section;
        $("body").children().each((i, e) => {
            console.log(`Processing node '${e.tagName}' with className as '${$(e).attr("class")}'`);

            const $e = $(e);
            if (e.tagName == "h2") {
                if (section) {
                    // Our previous section is completing... Therefore insert it and create a new placeholder
                    finalDoc.sections.push(section);
                }
                section = {title: $e.text(), mainBody: "", elements: []};
            } else if (!section) {
                const type = this.identifyTypeOfElement(e, $e, $);
                let element;
                switch (type) {
                    case "text": element = converter.toText($e, $); break;
                    default:
                        throw new Error("We have not created a section yet and therefore we can expect only Textual Nodes till then. But we got " + type);
                }
                finalDoc.mainBody += element.body;
            } else {
                const type = this.identifyTypeOfElement(e, $e, $);
                let element;
                switch (type) {
                    case "text": element = converter.toText($e, $); break;
                    case "accordion": element = converter.toAccordion($e, $); break;
                    case "product-offer": element = converter.toBox($e, $); break;
                }
                section.elements.push(element);
            }
            finalDoc.sections.push(section);
        }); 
        finalDoc.sections.push(section);
    
        console.log(JSON.stringify(finalDoc, null, 4));
        // console.log(output);
    }

    cleanse(html) {
        console.info(chalk.greenBright("Cleaning our HTML..."));
        let cleansedHtml = minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            removeEmptyAttributes: true,
            removeEmptyElements: true,
            removeRedundantAttributes: true
        });

        const $ = cheerio.load(cleansedHtml, {decodeEntities: false});
        $("style").remove();
        $("script").remove();
        if ($("body").children().length == 1 && $("body > div").hasClass("article-txt")) {
            cleansedHtml = $("body > div").html();
        }
    
        console.log(chalk.gray.bold("Original HTML"));
        console.log(chalk.gray(html));
        console.log(chalk.gray.bold("Cleansed HTML"));
        console.log(chalk.gray(cleansedHtml));

        return cleansedHtml;    
    }

    identifyTypeOfElement(e, $e, $) {
        if (e.tagName == "p") {
            return "text";
        } else if (e.tagName == "h3") {
            return "text";
        } else if ($(e).hasClass("twi-accordion")) {
            return "accordion";
        } else if ($(e).hasClass("border-blue")) {
            return "product-offer";
        }
    }
}

class Migrator {
    connectToDB() {
        const connection = mysql.createConnection({host: 'localhost', user: 'cloud', password: 'scape', database: 'brint' });
        connection.connect();
        return connection;
    }

    loadLPDAndParse(id, connection, parser) {
        const parseXmlString = function(xmlRow) {
            let output;
            parseString(xmlRow, function (err, jsonRow) {
                if (!jsonRow || !jsonRow["com.bankbazaar.model.LandingPageDataDetail"]["messagingMap"]) {
                    return undefined;
                }
                output = jsonRow;
            });
            return output;
        }
                
        connection.query("SELECT id, namespace, detail FROM landing_page_data WHERE id =" + id, function(error, dbRows, fields) {
            if (error) {
                throw error
            };
            dbRows.some((xmlRow) => {
                console.log(`Processing ${xmlRow.id} with namespace ${xmlRow.namespace}`);
                const jsonRow = parseXmlString(xmlRow.detail);
                if (jsonRow == undefined) {
                    console.error(`${xmlRow.namespace} with id=${xmlRow.id} looks to be corrupted as it has no messagingMap`);
                    return true;
                }
                const messagingMap = jsonRow["com.bankbazaar.model.LandingPageDataDetail"]["messagingMap"];
                if (messagingMap.length > 1 || !messagingMap[0].entry) {
                    console.error(`${xmlRow.namespace} with id=${xmlRow.id} looks to be corrupted as it has ${messagingMap.length} elements in messagingMap or has no entry`);
                    return;
                }
                const attrMap = messagingMap[0]["entry"];
                let title, primaryContent, secondaryContent;
                attrMap.forEach((attr) => {
                    switch (attr.string[0]) {
                        case "H1_TITLE": 
                            title = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                            break;
                        case "PRIMARY_CONTENT": 
                            primaryContent = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                            break;
                        case "SECONDARY_CONTENT":
                            secondaryContent = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                            break;
                    }
                });
                parser.parseAndConvert(primaryContent, title);
            });
        });
    }


    start(lpdId) {
        const parser = new Parser();
        const connection = this.connectToDB();
        this.loadLPDAndParse(lpdId, connection, parser);
        connection.end();
    }
}

new Migrator().start(4858);
// new Migrator().start(859);
