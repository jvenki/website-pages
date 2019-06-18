const Database = require("./Database");
const DomWalker = require("./DomWalker");
const Cleanser = require("./Cleanser");
const LpdXml2Json = require("./LpdXml2Json");
const DocCreator = require("./DocCreator");
const winston = require("winston");
const chalk = require("chalk");

winston.add(new winston.transports.Console({format: winston.format.simple()}));

const startTime = new Date().getTime();
let successCount = 0;
let failedCount = 0;
const errorDistribution = {};

const convert = (xmlRow) => {
    winston.verbose(`Processing ${xmlRow.id} with namespace ${xmlRow.namespace}`);
    try {
        const jsonRow = new LpdXml2Json().convert(xmlRow);
        const cleansedPrimaryHtml = new Cleanser().cleanse(jsonRow.primaryContent);
        const convertedPrimaryDoc = DomWalker.for(cleansedPrimaryHtml).forCreatingDoc(new DocCreator()).startWalking();
    
        // const cleansedSecondaryHtml = new Cleanser().cleanse(o.secondaryContent);
        // const convertedSecondaryDoc = DomWalker.for(cleansedSecondaryHtml).forCreatingDoc(new DocCreator()).startWalking();
    
        winston.verbose(chalk.green("\tStatus=Success"));
        if (winston.level == "info") {
            winston.info(chalk.green(`Successfully converted namespace '${xmlRow.namespace}' with ID ${xmlRow.id}`));
        }
        winston.debug(JSON.stringify(convertedPrimaryDoc, null, 4));
        //winston.debug(JSON.stringify(convertedSecondaryDoc, null, 4));
        
        successCount++;
        return {
            title: jsonRow.title, 
            original: {primaryContent: jsonRow.primaryContent, secondaryContent: jsonRow.secondaryContent}, 
            converted: {primaryContent: convertedPrimaryDoc, secondaryContent: {}}
        };
    } catch (e) {
        if (!errorDistribution[e.code]) {
            errorDistribution[e.code] = [];
        }
        errorDistribution[e.code].push(xmlRow.id);
        failedCount++;
        winston.verbose(chalk.red(`\tStatus=Error: Message=${e}`));
        winston.debug(e.payload);
        if (winston.level == "info") {
            winston.info(chalk.red(`Failed to convert namespace '${xmlRow.namespace}' with ID ${xmlRow.id}. Faced '${e}'`));
        }
    }
};

function printSummary() {
    winston.info(`Success = ${successCount} : Failed = ${failedCount} : Time Taken = ${new Date().getTime() - startTime}`);
    winston.info("Summary:");
    Object.keys(errorDistribution).forEach((key) => {
        winston.info(`\t${key} = ${errorDistribution[key].length}`);
    });
    Object.keys(errorDistribution).forEach((key) => {
        winston.info(`\t${key} = ${errorDistribution[key]}`);
    });
}

function mainSingle() {
    winston.level = "debug";
    const db = new Database();
    db.connect();
    // db.query(859).then(convert).catch((err) => console.error(err));
    // db.query(4858).then(convert).catch((err) => console.error(err));
    // db.query(9427).then(convert).catch((err) => console.error(err));
    db.query(4).then(convert).catch((err) => console.error(err));
    db.query(5).then(convert).catch((err) => console.error(err));
    db.query(7).then(convert).catch((err) => console.error(err));
    db.releaseConnection();
}

function mainAll() {
    winston.level = "info";
    const db = new Database();
    db.connect();
    db.all(convert, printSummary);
    db.releaseConnection();
}

// mainSingle();
mainAll();

module.exports = convert;