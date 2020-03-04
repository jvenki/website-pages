import minimist from "minimist";
import fs from "fs";
import {isEqual, chunk} from "lodash";

const cliArgs = minimist(process.argv.slice(2));

const oldFile = require(`../${cliArgs.oldFile}`);
const newFile = require(`../${cliArgs.newFile}`);

const modifiedOldObjects = {};
const modifiedNewObjects = {};
const allKeys = [];

const applyKnownChanges = (oldObject) => {
    const str = 
        JSON.stringify(oldObject)
            .replace(/<td><strong>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/strong><\/td>/g, "<th>$1</th>")
            .replace(/<td><p><strong>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/strong><\/p><\/td>/g, "<th>$1</th>")
            .replace(/<td><p>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/p><\/td>/g, "<td>$1</td>")
            .replace(/<td colspan=(\\"\d+\\")><strong>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/strong><\/td>/g, "<th colspan=$1>$2</th>")
            .replace(/<td colspan=(\\"\d+\\")><p><strong>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/strong><\/p><\/td>/g, "<th colspan=$1>$2</th>")
            .replace(/<td colspan=(\\"\d+\\")><p>([a-zA-Z0-9?\-+%*.,:'()\s\\/]*)<\/p><\/td>/g, "<td colspan=$1>$2</td>")
            ;
    return JSON.parse(str);
};

Object.keys(newFile).forEach((key) => {
    const oldObject = oldFile[key];
    if (!oldObject) {
        return;
    }

    allKeys.push(parseInt(key));
    const oldObjectModified = applyKnownChanges(oldObject);
    const newObject = newFile[key];
    if (!isEqual(oldObjectModified, newObject)) {
        modifiedOldObjects[key] = oldObjectModified;
        modifiedNewObjects[key] = newObject;
    }
});

// Object.keys(oldFile).filter((key) => !newFile[key]).forEach((key) => {
//     allKeys.push(parseInt(key));
//     const oldObject = oldFile[key];
//     modifiedOldObjects[key] = oldObject;
// });

allKeys.sort((a, b) => a-b);

chunk(allKeys, 1000).forEach((keys, i) => {
    const modifiedOldObjectsPart = keys.reduce((aggr, key) => {aggr[key] = modifiedOldObjects[key]; return aggr;}, {});
    const modifiedNewObjectsPart = keys.reduce((aggr, key) => {aggr[key] = modifiedNewObjects[key]; return aggr;}, {});
    fs.writeFileSync(`./build/compare-${i}-old.json`, JSON.stringify(modifiedOldObjectsPart, null, 4));
    fs.writeFileSync(`./build/compare-${i}-new.json`, JSON.stringify(modifiedNewObjectsPart, null, 4));
});
