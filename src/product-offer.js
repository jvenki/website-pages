const mysql = require("mysql");
const parseString = require("xml2js").parseString;

function connectToDB() {
    const connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'cloud',
        password : 'scape',
        database : 'brint'
      });
    connection.connect();
    return connection;
}

function computeFeatureTypeGroupUsages() {
    var lineReader = require('readline').createInterface({
        input: require('fs').createReadStream('./pftg-name.txt')
    });
    
    const map = {};
    lineReader.on('line', function (line) {
        if ((line.match(/^[A-Z]{2}_/) || line.startsWith("TWI")) && line.includes("MOBILE_")) {
            const productName = line.startsWith("TWI") ? "TWI" : line.substring(0, 2);
            let groupName = line.replace(/^[A-Z]+_/, "").replace(/MOBILE_/, "");
            let isLandingSpecific = false;
            if (groupName.match(/LANDING_/)) {
                isLandingSpecific = true;
                groupName = groupName.replace(/LANDING_/, "");
            }
            if (!map[groupName]) {
                map[groupName] = {search_count: 0, landing_count: 0, search: [], landing: []};
            }
            if (isLandingSpecific) {
                map[groupName]["landing_count"] = map[groupName]["landing_count"] + 1;
                map[groupName]["landing"].push(productName);
            } else {
                map[groupName]["search_count"] = map[groupName]["search_count"] + 1;
                map[groupName]["search"].push(productName);
            }
        }
    });
    
    lineReader.on("close", function() {
        Object.keys(map).forEach(function(key) {
            console.log(`${key}\t${map[key]["search_count"]}\t${map[key]["landing_count"]}\t${map[key]["search"]}\t${map[key]["landing"]}`)
        })
    })    
}

function parsePropertyMapOfProductOffer() {
    const connection = connectToDB();
    connection.query("SELECT id, name, product_type_id, cp_id, property_map FROM product_offer", function(error, dbRows, fields) {
        if (error) {
            throw error
        };
        console.log("Results = ", dbRows.length);
    
        dbRows.some((row) => {
            const propertyMap = JSON.parse(row.property_map);
            //console.log(`Processing ${row.id} with PropertyMap ${row.property_map}`);
            if (!propertyMap) {
                return false;
            }
            const keys = Object.keys(propertyMap);
            if (keys.filter(function(k) {k != "map"}).length > 0) {
                console.log(`We found keys beyond *map* alone in the property_map of ${row.id}`);
            }
            // return true;
        });
    });    
    connection.end();

}

// computeFeatureTypeGroupUsages();
parsePropertyMapOfProductOffer();