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
        fs.writeFileSync("./data/pri-content-usage-counts.json", JSON.stringify(tracker.usageCount));
        fs.writeFileSync("./data/pri-content-usage-ids.json", JSON.stringify(tracker.usageIds));
        fs.writeFileSync("./data/pri-content-usage.csv", Object.keys(tracker.usageCount).map((k) => `${k}, ${tracker.usageCount[k]}, "${tracker.usageIds[k].slice(0, 100).join(";")}"`).join("\n"));
        const sortedIdSummary = Object.keys(tracker["idSummary"]).sort((a, b) => tracker["idSummary"][a].length > tracker["idSummary"][b].length);
        fs.writeFileSync("./data/pri-content-id-summary.json", JSON.stringify(sortedIdSummary.map((id) => ({id, usages: tracker["idSummary"][id]}))));
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

function main() {
    const connection = connectToDB();
    executeQuery(connection);
    connection.end();
}

main();