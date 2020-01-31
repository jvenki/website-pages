// @flow
import fs from "fs";
import MySQLClient from "./MySQLClient";
import LPDRowFieldExtractor from "./LPDRowFieldExtractor";
import {logger} from "./Logger";
import MongoClient from "./MongoClient";
import {isEqual} from "lodash";
import DomWalker from "./DomWalker";
import DocBuilder from "./DocBuilder";
import Cleanser from "./Cleanser";
import MigrationError, {ErrorCode, CleanserIssueCode} from "./MigrationError";
import pretty from "pretty";
import {diff} from "deep-object-diff";
import util from "util";

import snapshotForValidation from "../../data/migrator-validating-test-data.json";
import chalk from "chalk";
import { correctLPDHtml } from "./ManualCorrections";

type LPDJsonType = {id: number, namespace: string, old: Object, doc: Object, conversionStatus: string, conversionError: MigrationError, conversionIssues: Array<Error>};

const setImmediatePromise = util.promisify(setImmediate);

export default class Migrator {
    limitToIds: Array<number>;
    ignoreIds: Array<number>;
    mysqlClient: MySQLClient;
    mongoClient: MongoClient;
    docConversionStatus: {[number]: LPDJsonType};
    updateSnapshot: boolean;

    constructor(limitToIds: Array<number>, ignoreIds: Array<number>, updateSnapshot: boolean) {
        this.limitToIds = limitToIds;
        this.ignoreIds = ignoreIds;
        this.mysqlClient = new MySQLClient();
        this.mongoClient = new MongoClient();
        this.docConversionStatus = {};
        this.updateSnapshot = updateSnapshot;
    }

    async startSweeping() {
        const startTime = new Date().getTime();

        await this.mysqlClient.connect();
        await this.mongoClient.connect();

        const dbRows = await this.mysqlClient.query(this.limitToIds, this.ignoreIds);

        await this.processRowAtIndex(0, dbRows);
        
        this.mysqlClient.releaseConnection();
        setTimeout(() => this.mongoClient.disconnect(), 1000);

        printFinalSummary(this.docConversionStatus, startTime);

        if (this.updateSnapshot) {
            fs.writeFileSync("./data/migrator-validating-test-data.json", JSON.stringify(snapshotForValidation, null, 4));
        }
    }

    async processRowAtIndex(i: number, dbRows: Array<Object>) {
        const xmlBasedRow: Object = dbRows[i];
        logger.info(`Processing Row with ID ${xmlBasedRow.id} and Namespace ${xmlBasedRow.namespace}`);
        const lpdJson: Object = {old: {}, new: {}};
        lpdJson.id = xmlBasedRow.id;
        lpdJson.namespace = xmlBasedRow.namespace;

        try {
            lpdJson.old = new LPDRowFieldExtractor().extractFrom(xmlBasedRow);

            const {doc: primaryDoc, issues, opLog} = convertHTMLIntoJSON(lpdJson.old.primaryContent, lpdJson.id);
            lpdJson.new.primaryDoc = primaryDoc;
            lpdJson.new.primaryOpLog = opLog;
            lpdJson.conversionIssues = lpdJson.conversionIssues ? lpdJson.conversionIssues.concat(issues) : issues;

            validateAgainstPreviousSnapshot(lpdJson, this);
        } catch (e) {
            lpdJson.conversionError = e;
        }

        lpdJson.conversionStatus = computeStatusOfConversion(lpdJson);        
        this.docConversionStatus[lpdJson.id] = lpdJson;

        printDocSummary(lpdJson);

        await this.mongoClient.save(lpdJson);
        await setImmediatePromise().then(() => {
            if (i >= dbRows.length-1) {
                return;
            }
    
            return this.processRowAtIndex(i+1, dbRows);
        });
    }
}

const convertHTMLIntoJSON = (html, lpdId) => {
    const issues = [];
    const opLog = [];
    const onElement = (elem) => {docBuilder.add(elem);};
    const onIssue = (err) => {issues.push(err);}; 
    const onOpLog = (converterName: string, source: Array<Object>, target: Array<Object>) => {opLog.push({converterName, source: source.map((s) => s.toString()), target});};
    const docBuilder = new DocBuilder();

    const correctedHtml = correctLPDHtml(html, lpdId, onIssue);
    const cleansedHtml = new Cleanser().cleanse(correctedHtml, onIssue);
    DomWalker.for(cleansedHtml, onElement, onIssue, onOpLog).execute();
    return {doc: docBuilder.build(), issues, opLog};
};

const validateAgainstPreviousSnapshot = (lpdJson, self) => {
    if (!snapshotForValidation[lpdJson.id]) {
        // We dont have a snapshot for this ID.
        return;
    }
    if (isEqual(snapshotForValidation[lpdJson.id], JSON.parse(JSON.stringify(lpdJson.new.primaryDoc)))) {
        // Great. Inspite of other changes, we have not cuased any regression
        return;
    }

    const differences = diff(snapshotForValidation[lpdJson.id], lpdJson.new.primaryDoc);
    logger.silly(JSON.stringify(lpdJson.new.primaryDoc, null, 4));
    logger.verbose("Snapshot Compare Failed: Differences Found =\n" + JSON.stringify(differences));
    if (self.updateSnapshot) {
        snapshotForValidation[lpdJson.id] = lpdJson.new.primaryDoc;
    }
    throw new MigrationError(ErrorCode.SNAPSHOT_MISMATCH, undefined, JSON.stringify(differences));
};

const computeStatusOfConversion = (lpdJson) => {
    let status = "SUCCESS";
    if (lpdJson.conversionError) {
        status = "ERROR";
    } else if (lpdJson.conversionIssues.length > 0) {
        const nonCleansingIssues = lpdJson.conversionIssues.filter((i) => !Object.keys(CleanserIssueCode).includes(i.code));
        if (nonCleansingIssues.length > 0) {
            status = "WARNING";
        }
    }

    return status;
};

const printDocSummary = (lpdJson) => {
    const {conversionStatus} = lpdJson;
    if (conversionStatus == "SUCCESS") {
        logger.info(`    Status = ${conversionStatus}`);
        logger.silly(JSON.stringify(lpdJson.new.primaryDoc, null, 4));
    } else if (conversionStatus == "WARNING") {
        logger.warn(`    Status = ${conversionStatus}`);
        const nonCleansingIssues = lpdJson.conversionIssues.filter((i) => !Object.keys(CleanserIssueCode).includes(i.code));
        nonCleansingIssues.forEach((i) => logger.warn(`        ${i.message}`));
        logger.silly(JSON.stringify(lpdJson.new.primaryDoc, null, 4));
    } else {
        logger.error(`    Status=Error: ${lpdJson.conversionError.stack}`);
        logger.verbose(pretty(lpdJson.conversionError.payload, {ocd: true}));
    }
};

const printFinalSummary = (docConversionStatus: Object, startTime: number) => {
    let successCount = 0;
    let warningCount = 0;
    let failedCount = 0;
    const errorDistribution = {};
    const convIssuesDistribution = {};
    const cleansingIssuesDistribution = {};

    // $SuppressFlowCheck: Object.values.forEach will give lpdJson as LPDJsonType only
    Object.values(docConversionStatus).forEach((lpdJson: LPDJsonType) => {
        lpdJson = ((lpdJson: any): LPDJsonType);
        if (lpdJson.conversionStatus == "SUCCESS" || lpdJson.conversionStatus == "WARNING") {
            if (lpdJson.conversionStatus == "SUCCESS") {
                successCount++;
            } else {
                warningCount++;
            }
            lpdJson.conversionIssues.forEach((i) => { // $SuppressFlowCheck: 
                const map = Object.keys(CleanserIssueCode).includes(i.code) ? cleansingIssuesDistribution : convIssuesDistribution;
                if (!map[i.message]) {
                    map[i.message] = new Set();
                }
                map[i.message].add(lpdJson.id);
            });
        } else {
            failedCount++;
            let errorName = lpdJson.conversionError.code;
            if (lpdJson.conversionError.code == ErrorCode.UNKNOWN_TAG.code) {
                errorName = lpdJson.conversionError.message.replace(/UNKNOWN_TAG: We dont know how to handle the Tag/, "UNKNOWN_TAG");
            }
            if (!errorDistribution[errorName]) {
                errorDistribution[errorName] = new Set();
            }
            errorDistribution[errorName].add(lpdJson.id);
        }
    });
    logger.info(chalk.underline.blue.bold("\n\nFinal Summary:"));
    logger.info(`Success = ${successCount} : Warning = ${warningCount} : Failed = ${failedCount} : Time Taken = ${new Date().getTime() - startTime}`);
    logger.info(chalk.red.bold("Summary - Distribution of Error Codes"));
    Object.keys(errorDistribution).forEach((key) => {
        const ids = Array.from(errorDistribution[key]);
        logger.info(chalk.red(`    ${key} = `) + chalk.bgCyanBright.bold(errorDistribution[key].size) + ` [${ids}]`);    
    });
    logger.info(chalk.yellow.bold("Summary - Distribution of Warning Issues"));
    Object.keys(convIssuesDistribution).forEach((key) => {
        const ids = Array.from(convIssuesDistribution[key]);
        logger.info(chalk.yellow(`    ${key} = `) + chalk.bgCyanBright.bold(convIssuesDistribution[key].size) + ` [${ids}]`);
    });
    logger.info(chalk.grey.bold("Summary - Distribution of Cleansing Issues"));
    Object.keys(cleansingIssuesDistribution).forEach((key) => {
        const ids = Array.from(cleansingIssuesDistribution[key]);
        logger.info(chalk.grey(`    ${key} = `) + chalk.bgCyanBright.bold(cleansingIssuesDistribution[key].size) + ` [${ids}]`);
    });
};