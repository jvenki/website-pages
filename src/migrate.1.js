const mysql = require("mysql");
const parseString = require("xml2js").parseString;
const cheerio = require("cheerio");
const minify = require('html-minifier').minify;
const pretty = require('pretty');


const fs = require("fs");

function connectToDB() {
    const connection = mysql.createConnection({host: 'localhost', user: 'cloud', password: 'scape', database: 'brint' });
    connection.connect();
    return connection;
}

function loadContentsFor(id, connection) {
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
            migrate(title, primaryContent, secondaryContent);
        });
    });
}

function parseXmlString(xmlRow) {
    let output;
    parseString(xmlRow, function (err, jsonRow) {
        if (!jsonRow || !jsonRow["com.bankbazaar.model.LandingPageDataDetail"]["messagingMap"]) {
            return undefined;
        }
        output = jsonRow;
    });
    return output;
}

function migrate(title, primaryContent, secondaryContent) {
    primaryContent = cleanse(primaryContent);

    const $ = cheerio.load(primaryContent, {decodeEntities: false});
    if ($("body").children().length == 1 && $("body > div").hasClass("article-txt")) {
        const origBody = $("body > div").html();
        $("body").html(origBody)
    }

    const elements = [];
    let section;
    let mainText = "";
    $("body").children().each(function(i, e) {
        const $e = $(e);
        console.log("Processing node ", e.tagName, "with className as ", $e.attr("class"));
        if (e.tagName == "style" || e.tagName == "script") {
            console.warn("Removing elements of type ", e.tagName);
            $e.remove();
        } else if (e.tagName == "h2") {

        } else if ($e.hasClass("twi-accordion")) {
            const panels = migrateToAccordion($e, $);
            elements.push({type: "Accordion", props: {panels: panels}});
        } else if ($e.hasClass("border-blue")) {
            const box = migrateToBox($e, $);
            elements.push({type: "Box", props: box});
        } else if (section) {
            //TODO: There is a bug. When there are other elements like BOX starting, either we need to add it to the subsection or clear the section and move it out. 
            if (e.tagName == "h3") {
                section.subsections.push({title: $e.html(), body: ""});
            } else {
                if (section.subsections.length > 0) {
                    section.subsections[section.subsections.length-1].body += $e.html();
                } else {
                    section.body += $e.html();
                }
            }
        } else {
            mainText += $e.html();
        }
    }); 

    if (section) {
        elements.push({type: "Section", props: section});
    }

    const doc = {
        title: title,
        body: mainText,
        elements: elements
    };

    console.log(JSON.stringify(doc, null, 4));
    // console.log(doc);
}

function identifyTypeOfSection($h2, $) {
    const title = $h2.text();
    let sectionType;
    // H2 Tag is not a container. Therefore we dont know where the section will end and what is the type it is going to represent
    $(e).nextUntil("h2").each(function (i, e) {
        if (e.tagName == "p") {
            return true;
        }
        if (e.tagName == "h3") {
            sectionType = "content";
            return false;
        } else if ($(e).hasClass("acco"))
    });

    if (!section) {
        section = {};
    } else {
        elements.push({type: "Section", props: section});
        section = {};
    }
    section = {title: $e.text(), body: "", subsections: []};    
}

function migrateToAccordion($element, $) {
    // console.warn($element.html());

    const panels = [];
    $element.find(".panel").each(function(i, panel) {
        const title = $(panel).find(".panel-heading h2").text();
        const body = $(panel).find(".panel-body").html();
        panels.push({title, body});
    });
    return panels;
}

function migrateToBox($element, $) {
    // console.warn($box.html());
    const $titleBox = $element.children().eq(0);
    const $imgBox = $titleBox.find("img");
    const $bodyBox = $titleBox.nextAll("div");

    const title = $titleBox.find("h5 > a").text() || $titleBox.find("h5").text();
    const href = $titleBox.find("h5 > a").attr("href");
    const imgSrc = $imgBox.attr("data-original") || $imgBox.attr("src");
    const body = $bodyBox.html();

    return {title, href, imgSrc, body};
}

function cleanse(contents) {
    let cleansedContents = minify(contents, {
        collapseWhitespace: true,
        removeComments: true,
        removeEmptyAttributes: true,
        removeEmptyElements: true,
        removeRedundantAttributes: true
    });

    return cleansedContents;
}

function load() {
    const connection = connectToDB();
    // loadContentsFor(4858, connection);
    loadContentsFor(859, connection);
    connection.end();
}

load();

module.exports = {load: load}
