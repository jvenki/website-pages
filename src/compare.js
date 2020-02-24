import minimist from "minimist";
import fs from "fs";

const cliArgs = minimist(process.argv.slice(2));

const oldFile = require(`../build/${cliArgs.oldFile}.json`);
const newFile = require(`../build/${cliArgs.newFile}.json`);

const filteredKeys = Object.keys(newFile).filter((key) => Boolean(oldFile[key]));
const filteredObjects = filteredKeys.reduce((aggr, key) => {aggr[key] = newFile[key]; return aggr;}, {});

fs.writeFileSync(`./build/${cliArgs.oldFile}-changed.json`, JSON.stringify(filteredObjects, null, 4));