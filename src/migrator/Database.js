const mysql = require("mysql");
const parseString = require("xml2js").parseString;
const chalk = require("chalk");

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

class Database {
    connect() {
        this.connection = mysql.createConnection({host: 'localhost', user: 'cloud', password: 'scape', database: 'brint' });
        this.connection.connect();
    }

    query(id) {
        return new Promise((resolve, reject) => {
            this.connection.query("SELECT id, namespace, detail FROM landing_page_data WHERE id =" + id, function(error, dbRows, fields) {
                if (error) {
                    reject(error);
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
                    resolve({title, primaryContent, secondaryContent});
                });
            });
        });
    }

    releaseConnection() {
        this.connection.end();
    }
}

module.exports = Database;