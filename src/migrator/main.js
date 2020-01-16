import Migrator from "./Migrator";
import snapshotForValidation from "../../data/migrator-validating-test-data.json";
import {consoleTransport} from "./Logger";
import minimist from "minimist";

const cliArgs = minimist(process.argv.slice(2));

let limitToIds = [];
let ignoreIds = [];

if (cliArgs.limitToIds) {
    limitToIds = String(cliArgs.limitToIds).split(",").map((s) => parseInt(s));
} else if (cliArgs.runRegression) {
    limitToIds = Object.keys(snapshotForValidation);
}

if (cliArgs.ignoreIds) {
    ignoreIds = String(cliArgs.ignoreIds).split(",").map((s) => parseInt(s));
}

if (cliArgs.logLevel) {
    consoleTransport.level = cliArgs.logLevel;
}

new Migrator(limitToIds, ignoreIds, cliArgs.runRegression).startSweeping();
