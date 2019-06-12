/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
const mysql = require("mysql");
const parseString = require("xml2js").parseString;
const cheerio = require("cheerio");

const fs = require("fs");


function connectToDB() {
    const connection = mysql.createConnection({
        host     : "localhost",
        user     : "cloud",
        password : "scape",
        database : "brint"
    });
    connection.connect();
    return connection;
}

function executeQuery(connection) {
    // let lastCompletedId = fs.readFileSync("query.log") || 0;
    let lastCompletedId = 0;
    connection.query("SELECT id, namespace, detail FROM landing_page_data WHERE enabled = 1 and id > " + lastCompletedId, function(error, dbRows, fields) {
        if (error) {
            throw error;
        }
        console.log("Results = ", dbRows.length);
    
        const tracker = {usageCount: {}, usageIds: {}, idSummary: {}};
        const priContentFailedParsing = 0, secContentFailedParsing = 0;
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
            let priStatus = true, secStatus = true;
            attrMap.forEach((attr) => {
                switch (attr.string[0]) {
                    case "PRIMARY_CONTENT": priStatus = handlePrimaryContent(attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0], xmlRow.id, xmlRow.namespace, tracker); break;
                    // case "SECONDARY_CONTENT": secStatus = handleSecondaryContent(attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0], xmlRow.id, xmlRow.namespace, tracker); break;
                }
            });

            if (!priStatus || !secStatus) {
                return true;
            }
            lastCompletedId = xmlRow.id;
            return false;
        });

        console.log("\n******************************************************************************");
        console.log("Processed ", dbRows.length, " rows");
        fs.writeFileSync("pri-content-usage-counts.txt", JSON.stringify(tracker.usageCount));
        fs.writeFileSync("pri-content-usage-ids.txt", JSON.stringify(tracker.usageIds));
        const sortedIdSummary = Object.keys(tracker["idSummary"]).sort((a, b) => tracker["idSummary"][a].length > tracker["idSummary"][b].length);
        fs.writeFileSync("pri-content-id-summary.txt", JSON.stringify(sortedIdSummary.map((id) => ({id, usages: tracker["idSummary"][id]}))));
        // fs.writeFileSync("query.log", lastCompletedId);
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

function handleSecondaryContent(content, id, namespace) {
    if (!content) {
        return true;
    }
    const $ = cheerio.load(content);
    $("li.news-green").remove();
    if ($("div.news-widget > ul").text().trim() == "") {
        $("div.news-widget > ul").remove();
    }
    $("div.news-widget > h2").remove();
    $("div.news-widget > div > h2").remove();
    $("div.news-widget > h3").remove();
    if ($("div.news-widget").text().trim() == "") {
        $("div.news-widget").remove();
    }

    $("h3").remove();
    $("div.bb-products-invest").remove();

    $("a").filter(function(i, e) {return $(e).attr("href").includes("variant=slide");}).remove();
    $("div.twi-accordion").remove();
    $("div.product_interlink").remove();

    $("div").filter(function(i, e) {
        if ($(e).html().trim() == "") {
            return true;
        }
        if ($(e).html().trim().includes("sitemap.html")) {
            return true;
        }
        if ($(e).html().trim().includes("disqus_thread")) {
            return true;
        }
        return false;
    }).remove();

    if ($("h2").first().html() && $("h2").first().html().includes("sitemap.html")) {
        $("h2").first().remove();
    }

    $("div.link-section").remove();
    $("ul.bb-sitemap").remove();

    if ($("li.list-group-meroon").first().html() && $("li.list-group-meroon").first().html().includes("more")) {
        $("li.list-group-meroon").first().remove();
    }

    if ($("p").length < 3) {
        $("p").remove();
    }

    const finalContent = $.text().replace(/\n/, "", "g").trim();
    const finalHtml = $.html();
    if (finalContent == "" || [4, 482, 487, 500, 601, 835, 836, 843, 847, 898, 1410, 1994, 4731, 9342, 9347, 19644, 19901].includes(id)) {
        return true;
    }

    console.warn(`SecondaryContent for LP with ID=${id} with namespace='${namespace}' seems to have tags we dont know yet. @@@@ ${finalHtml}`);
    return false;
}

function handlePrimaryContent(content, id, namespace, tracker) {
    if (!content) {
        return true;
    }
    const $ = cheerio.load(content);
    $("*").each(function(i, e) {
        const ancestors = $(e).parentsUntil("body").map(function(j, p) {return getNodeTagNameAndClassNames(p, $);}).get().reverse();
        const myName = getNodeTagNameAndClassNames(e, $);
        const fullPathName = [...ancestors, myName].join(" -> ");
        trackUsage(fullPathName, tracker, id);
    });
    return true;
}

function getNodeTagNameAndClassNames(e, $) {
    let classNames = "";
    if ($(e).attr("class")) {
        classNames = "." + $(e).attr("class").replace(/ /g, ".");
    }
    return $(e).get(0).tagName + classNames;
}

function trackUsage(fullPathName, tracker, id) {
    if (!tracker["usageCount"][fullPathName]) {
        tracker["usageCount"][fullPathName] = 0;
    }
    tracker["usageCount"][fullPathName] = tracker["usageCount"][fullPathName] + 1;

    if (!tracker["usageIds"][fullPathName]) {
        tracker["usageIds"][fullPathName] = [];
    }
    if (!tracker["usageIds"][fullPathName].includes(id)) {
        tracker["usageIds"][fullPathName].push(id);
    }

    if (!tracker["idSummary"][id]) {
        tracker["idSummary"][id] = [];
    }
    if (!tracker["idSummary"][id].includes(fullPathName)) {
        tracker["idSummary"][id].push(fullPathName);
    }
}

function handlePrimaryContent2(content, id, namespace, tracker) {
    if (!content) {
        return true;
    }
    const $ = cheerio.load(content);

    removeAndTrack($, "style", tracker, id);
    
    removeAndTrack($, "div.hungry-table", tracker, id);
    removeAndTrack($, "div.js-hungry-table", tracker, id);
    removeAndTrack($, "div.product-hl-table", tracker, id);
    removeAndTrack($, "div.jumbotron", tracker, id); 
    removeAndTrack($, "div.lp-banner", tracker, id); 
    removeAndTrack($, "div.list-group-item", tracker, id); 
    removeAndTrack($, "div.twi-accordion", tracker, id); 
    removeAndTrack($, "div.ln-accordion", tracker, id); 
    removeAndTrack($, "div.cta-section", tracker, id);
    removeAndTrack($, "div.bb-landing-banner", tracker, id);

    removeAndTrack($, "body > h2", tracker, id);
    removeAndTrack($, "body > h3", tracker, id);
    removeAndTrack($, "body > h4", tracker, id);
    removeAndTrack($, "body > h5", tracker, id);
    removeAndTrack($, "body > b", tracker, id);
    removeAndTrack($, "body > p", tracker, id);
    removeAndTrack($, "body > a", tracker, id);
    removeAndTrack($, "body > ul", tracker, id);
    removeAndTrack($, "body > ol", tracker, id);

    removeAndTrack($, "body > div.container > div.row > div.col-md-12 > h2", tracker, id);
    ["product-description", "product-content"].forEach(function(n) {
        removeAndTrack($, `div.${n} > div > h2`, tracker, id);
        removeAndTrack($, `div.${n} > div > h3`, tracker, id);
        removeAndTrack($, `div.${n} > div > p`, tracker, id);
        removeAndTrack($, `div.${n} > div > a`, tracker, id);
        removeAndTrack($, `div.${n} > div > ul`, tracker, id);
        removeAndTrack($, `div.${n} > div > ol`, tracker, id);
        removeAndTrack($, `div.${n} > div > strong`, tracker, id);
        removeAndTrack($, `div.${n} > div.col-md-3 > div.col-md-12 > a`, tracker, id);

        removeAndTrack($, `div.${n} > div > div.col-md-12 > h2`, tracker, id);

        removeAndTrack($, `div.${n} > h`, tracker, id);
        removeAndTrack($, `div.${n} > h2`, tracker, id);
        removeAndTrack($, `div.${n} > h3`, tracker, id);
        removeAndTrack($, `div.${n} > p`, tracker, id);
        removeAndTrack($, `div.${n} > ul`, tracker, id);
        removeAndTrack($, `div.${n} > ol`, tracker, id); 
        removeAndTrack($, `div.${n} > strong`, tracker, id); 
        removeAndTrack($, `div.${n} > address`, tracker, id);     
    });

    removeAndTrack($, "blockquote.bq-section", tracker, id);

    ["col-md-3", "col-md-4", "col-md-6", "col-md-12"].forEach(function(gridLength) {
        removeAndTrack($, `body > div.row > div.${gridLength} > p`, tracker, id);
        removeAndTrack($, `body > div.row > div.${gridLength} > h2`, tracker, id);
        removeAndTrack($, `body > div.row > div.${gridLength} > h3`, tracker, id);
        removeAndTrack($, `body > div.row > div.${gridLength} > strong`, tracker, id);
        removeAndTrack($, `body > div.row > div.${gridLength} > ol`, tracker, id);
        removeAndTrack($, `body > div.row > div.${gridLength} > ul`, tracker, id);
        removeAndTrack($, `body > div.row > div.${gridLength} > img.product-img`, tracker, id);
        removeAndTrack($, `body > div.row > div.${gridLength} > div.pv-text-style`, tracker, id);

        removeAndTrack($, `body > div.product-content > div.row > div.${gridLength} > div.pv-text-style`, tracker, id);

        removeAndTrack($, `body > div.row > div.col-md-12 > div.row > div.${gridLength} > img.product-img`, tracker, id);
        removeAndTrack($, `body > div.row > div.col-md-12 > div.row > div.${gridLength} > div.pv-text-style`, tracker, id);
        removeAndTrack($, `body > div.row > div.col-md-12 > div.row > div.${gridLength} > h2`, tracker, id);
        removeAndTrack($, `body > div.row > div.col-md-12 > div.row > div.${gridLength} > p`, tracker, id);
    });

    removeAndTrack($, "body > div.row > p", tracker, id);
    removeAndTrack($, "body > div.row > h2", tracker, id);
    removeAndTrack($, "body > div.row > h3", tracker, id);
    removeAndTrack($, "body > div.row > ol", tracker, id);
    removeAndTrack($, "body > div.row > ul", tracker, id);

    removeAndTrack($, "body > div > h2", tracker, id);
    removeAndTrack($, "body > div > p", tracker, id);
    removeAndTrack($, "body > div > ul", tracker, id);
    removeAndTrack($, "body > div > ol", tracker, id);

    removeAndTrack($, "table.table-curved", tracker, id);
    removeAndTrack($, "body div.link-section", tracker, id);
    removeAndTrack($, "body div.product_interlink", tracker, id);
    removeAndTrack($, "body div.news-widget-aside", tracker, id);

    removeAndTrack($, "div.infographic-modal", tracker, id);
    removeAndTrack($, "div.pull-right a img", tracker, id);
    removeAndTrack($, "div.pull-right img", tracker, id);
    removeAndTrack($, "div.pull-right h3", tracker, id);
    removeAndTrack($, "div.pull-right strong", tracker, id);
    removeAndTrack($, "div.pull-right figcaption", tracker, id);
    removeAndTrack($, "iframe.video-frame", tracker, id);

    removeAndTrack($, "ul.list-group", tracker, id);

    removeAndTrack($, "table", tracker, id);
    removeAndTrack($, "body > li", tracker, id);
    removeAndTrack($, "body > div > li", tracker, id);
    removeAndTrack($, "body > strong", tracker, id);
    removeAndTrack($, "div.container-fluid > h3", tracker, id);
    removeAndTrack($, "small.addon-disclaimer", tracker, id);
    removeAndTrack($, "div.useful-links", tracker, id);
    removeAndTrack($, "div.fd-holder", tracker, id);
    removeAndTrack($, "div.product-description strong", tracker, id);
    removeAndTrack($, "div.product-description ul", tracker, id);
    removeAndTrack($, "body div.Product_Interlink", tracker, id);

    $("div.container-fluid").filter(function(i, e) {
        if ($(e).html().trim() == $(e).text().trim()) {
            return true;
        }
        return false;
    }).remove();
    $("a").filter(function(i, e) {
        return $("a").attr("href").includes("sitemap.html");
    }).parent().remove();

    removeEmptyNodes($);
    removeTextNodes($);
    removeEmptyNodes($);

    const finalContent = $.text().replace(/\n/, "", "g").replace(/\$LPD_EMBEDDED_ITEM_[A-Z_0-9]+/g, "").trim();
    const finalHtml = $.html().replace(/>\s+</g, "><");
    if (finalContent == "" || [8, 182, 191, 234, 236, 626].includes(id)) {
        return true;
    }

    console.warn(`@@@@@@@@ Primary for LP with ID=${id} with namespace='${namespace}' seems to have tags we dont know yet.\n${finalContent}\n\n\n${finalHtml}`);
    return false;
}

function removeAndTrack($, selector, tracker, id) {
    const selectedElements = $(selector);
    if (selectedElements.length == 0) {
        return;
    }
    tracker[selector] = (tracker[selector] || 0) + selectedElements.length;
    selectedElements.remove();
}

function removeEmptyNodes($) {
    const output = $("*").filter(function(i, e) {
        return $(e).text().trim() == "";
    }).remove();
    if (output.length > 0) {
        removeEmptyNodes($);
    }
}

function removeTextNodes($) {
    if ($("body > div.product-content > *").length == 0 && $("body > div.product-content").length == 1) {
        $("body > div.product-content").empty();
    }
    if ($("body > *").length == 0) {
        $("body").empty();
    }
}

function main() {
    const connection = connectToDB();
    executeQuery(connection);
    connection.end();
}

main();