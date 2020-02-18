const MongoNativeClient = require("mongodb").MongoClient;
import fs from "fs";

async function main() {
    let collection;
    let nativeClient;
    await MongoNativeClient.connect("mongodb://localhost:27017")
        .then((client) => {
            const db = client.db("pages");
            nativeClient = client;
            collection = db.collection("pages");
        })
        .catch((err) => {
            console.error(err);
        });

    const rows = await collection.find({}, {sort: [["id", "asc"]]}).toArray();

    const output = rows.reduce((aggr, row) => {aggr[row.id] = row.new.primaryDoc; return aggr;}, {});
    fs.writeFileSync("./data/migrated-lpd-data.json", JSON.stringify(output, null, 4));

    nativeClient.close();
}

main();