import Migrator from "./Migrator";
import snapshotForValidation from "../../data/migrator-validating-test-data.json";
import {consoleTransport} from "./Logger";
import minimist from "minimist";

const cliArgs = minimist(process.argv.slice(2));

let restrictToIds = [];
let ignoreIds = [];
let idRange = "1,100";

if (cliArgs.restrictToIds) {
    restrictToIds = String(cliArgs.restrictToIds).split(",").map((s) => parseInt(s));
} else if (cliArgs.runRegression) {
    restrictToIds = Object.keys(snapshotForValidation);
} else if (cliArgs.idRange) {
    idRange = cliArgs.idRange;
}

if (cliArgs.ignoreIds) {
    ignoreIds = String(cliArgs.ignoreIds).split(",").map((s) => parseInt(s));
}

if (cliArgs.logLevel) {
    consoleTransport.level = cliArgs.logLevel;
}

new Migrator({restrictToIds, ignoreIds, idRange}, cliArgs.runRegression).startSweeping();
