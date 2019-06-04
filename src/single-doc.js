const mysql = require("mysql");
const parseString = require("xml2js").parseString;
const cheerio = require("cheerio");
const connection = mysql.createConnection({host: 'localhost', user: 'cloud', password : 'scape', database : 'brint'});
connection.connect();

let content;

connection.query("select detail from landing_page_data where id = 4858", function(error, dbRows) {
    dbRows.some((xmlRow) => {
        parseString(xmlRow.detail, function(err, jsonRow) {
            const attrMap = jsonRow["com.bankbazaar.model.LandingPageDataDetail"]["messagingMap"][0]["entry"];
            attrMap.forEach((attr) => {
                if (attr.string[0] == "PRIMARY_CONTENT") {
                    content = attr["com.bankbazaar.model.LandingPageMessageDetail"][0].message[0];
                }
            });
        });
    });
});