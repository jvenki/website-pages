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

import snapshotForValidation from "../../data/migrator-validating-test-data.json";
import chalk from "chalk";
import { correctLPDHtml } from "./ManualCorrections";

type LPDJsonType = {id: number, namespace: string, old: Object, doc: Object, conversionStatus: string, conversionError: MigrationError, conversionIssues: Array<Error>};

export default class Migrator {
    queryCriteria: Object;
    mysqlClient: MySQLClient;
    mongoClient: MongoClient;
    docConversionStatus: {[number]: LPDJsonType};
    updateSnapshot: boolean;

    constructor(queryCriteria: Object, updateSnapshot: boolean) {
        this.queryCriteria = queryCriteria;
        this.mysqlClient = new MySQLClient();
        this.mongoClient = new MongoClient();
        this.docConversionStatus = {};
        this.updateSnapshot = updateSnapshot;
    }

    async startSweeping() {
        const startTime = new Date().getTime();

        await this.mysqlClient.connect();
        await this.mongoClient.connect();

        const dbRows = await this.mysqlClient.query(this.queryCriteria);
        dbRows.forEach(async (row) => {await this.processRow(row);});
        
        this.mysqlClient.releaseConnection();
        setTimeout(() => this.mongoClient.disconnect(), 1000);

        printFinalSummary(this.docConversionStatus, startTime);

        if (this.updateSnapshot) {
            fs.writeFileSync("./data/migrator-validating-test-data.json", JSON.stringify(snapshotForValidation, null, 4));
        }
    }

    async processRow(xmlBasedRow: Object) {
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

            await validateAgainstPreviousSnapshot(lpdJson, this);
        } catch (e) {
            lpdJson.conversionError = e;
        }

        try {
            lpdJson.conversionStatus = computeStatusOfConversion(lpdJson);        
            this.docConversionStatus[lpdJson.id] = lpdJson;
    
            printDocSummary(lpdJson);
    
            await this.mongoClient.save(lpdJson);
        } catch (err) {
            // Nothing to log
        }
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

const validateAgainstPreviousSnapshot = async (lpdJson, self) => {
    const compareVersions = (oldVersion, newVersion, updateSnapshot, compareSource) => {
        if (!oldVersion || isEqual(oldVersion, newVersion)) {
            return;
        }
        logger.silly(JSON.stringify(newVersion, null, 4));
        const differences = diff(oldVersion, newVersion);
        logger.verbose(`${compareSource == "SNAPSHOT" ? "Snapshot" : "MongoDB"} Compare Failed: Differences Found =\n${JSON.stringify(differences)}`);
        if (updateSnapshot) {
            snapshotForValidation[lpdJson.id] = lpdJson.new.primaryDoc;
        }
        throw new MigrationError(compareSource == "SNAPSHOT" ? ErrorCode.SNAPSHOT_MISMATCH : ErrorCode.MONGO_MISMATCH, undefined, JSON.stringify(differences));
    };
    
    const newVersion = JSON.parse(JSON.stringify(lpdJson.new.primaryDoc));
    compareVersions(snapshotForValidation[lpdJson.id], newVersion, self.updateSnapshot, "SNAPSHOT");
    const oldRecord = await self.mongoClient.get(lpdJson.id);
    compareVersions(oldRecord ? oldRecord.new.primaryDoc : undefined, newVersion, false, "MONGODB");
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
        if (lpdJson.conversionError.code != ErrorCode.HTML_PARSE_ERROR.code) {
            logger.verbose(pretty(lpdJson.conversionError.payload, {ocd: true}));
        }
    }
};

const printFinalSummary = (docConversionStatus: Object, startTime: number) => {
    const erroredIds = [], successIds = [], warningIds = [];
    const errorDistribution = {};
    const convIssuesDistribution = {};
    const cleansingIssuesDistribution = {};

    // $SuppressFlowCheck: Object.values.forEach will give lpdJson as LPDJsonType only
    Object.values(docConversionStatus).forEach((lpdJson: LPDJsonType) => {
        lpdJson = ((lpdJson: any): LPDJsonType);
        if (lpdJson.conversionStatus == "SUCCESS" || lpdJson.conversionStatus == "WARNING") {
            if (lpdJson.conversionStatus == "SUCCESS") {
                successIds.push(lpdJson.id);
            } else {
                warningIds.push(lpdJson.id);
            }
            lpdJson.conversionIssues.forEach((i) => { // $SuppressFlowCheck: 
                const map = Object.keys(CleanserIssueCode).includes(i.code) ? cleansingIssuesDistribution : convIssuesDistribution;
                if (!map[i.message]) {
                    map[i.message] = new Set();
                }
                map[i.message].add(lpdJson.id);
            });
        } else {
            erroredIds.push(lpdJson.id);
            const errorName = lpdJson.conversionError.message;
            if (!errorDistribution[errorName]) {
                errorDistribution[errorName] = new Set();
            }
            errorDistribution[errorName].add(lpdJson.id);
        }
    });
    logger.info(chalk.underline.blue.bold("\n\nFinal Summary:"));
    logger.info(`Success = ${successIds.length} : Warning = ${warningIds.length} : Failed = ${erroredIds.length} : Time Taken = ${new Date().getTime() - startTime}`);
    logger.info(chalk.red.bold("Summary - Distribution of Error Codes")); // $SuppressFlowCheck
    logger.info(chalk.red(`        IDs = ${erroredIds}`));
    Object.keys(errorDistribution).forEach((key) => {
        const ids = Array.from(errorDistribution[key]); // $SuppressFlowCheck
        logger.info(chalk.red(`    ${key} = `) + chalk.bgCyanBright.bold(errorDistribution[key].size) + ` [${ids}]`);    
    });
    logger.info(chalk.yellow.bold("Summary - Distribution of Warning Issues")); // $SuppressFlowCheck
    logger.info(chalk.yellow(`        IDs = ${warningIds}`));
    Object.keys(convIssuesDistribution).forEach((key) => {
        const ids = Array.from(convIssuesDistribution[key]); // $SuppressFlowCheck
        logger.info(chalk.yellow(`    ${key} = `) + chalk.bgCyanBright.bold(convIssuesDistribution[key].size) + ` [${ids}]`);
    });
    logger.info(chalk.grey.bold("Summary - Distribution of Cleansing Issues"));
    Object.keys(cleansingIssuesDistribution).forEach((key) => {
        const ids = Array.from(cleansingIssuesDistribution[key]); // $SuppressFlowCheck
        logger.info(chalk.grey(`    ${key} = `) + chalk.bgCyanBright.bold(cleansingIssuesDistribution[key].size) + ` [${ids}]`);
    });
};