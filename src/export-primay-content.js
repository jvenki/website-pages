const MongoNativeClient = require("mongodb").MongoClient;
import fs from "fs";
const minify = require("html-minifier").minify;
import pretty from "pretty";

const cleanse = (html) => {
    try {
        return pretty(minify(html, {collapseWhitespace: true, removeComments: true, removeEmptyAttributes: true, removeRedundantAttributes: true}));
    } catch (err) {
    }
};

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
    rows.forEach((row) => {
        fs.writeFileSync(`./build/old/lpd-${row.id}.html`, cleanse(row.old.primaryContent));
    });

    nativeClient.close();
}

main();