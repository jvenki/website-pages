const MySQLClient = require("./MySQLClient");
const DomWalker = require("./DomWalker");
const Cleanser = require("./Cleanser");
const LpdXml2Json = require("./LpdXml2Json");
const DocCreator = require("./DocCreator");
const winston = require("winston");
const chalk = require("chalk");
const MongoClient = require("./MongoClient");

winston.add(new winston.transports.Console({format: winston.format.simple()}));

const docConversionStatus = {};

const convert = (xmlRow, mongoClient) => {
    winston.verbose(`Processing ${xmlRow.id} with namespace ${xmlRow.namespace}`);
    const id = xmlRow.id;
    const namespace = xmlRow.namespace;

    try {
        const jsonRow = new LpdXml2Json().convert(xmlRow);
        const title = jsonRow.title;
        const oldPrimaryContent = jsonRow.primaryContent;
        const oldSecondaryContent = jsonRow.secondaryContent;

        const newPrimaryContent = DomWalker.for(new Cleanser().cleanse(oldPrimaryContent)).forCreatingDoc(new DocCreator()).startWalking();    
        // const newSecondaryContent = DomWalker.for(new Cleanser().cleanse(oldSecondaryContent)).forCreatingDoc(new DocCreator()).startWalking();
    
        const conversionStatus = "SUCCESS";
        docConversionStatus[id] = {id, conversionStatus};
        winston.verbose(chalk.green("\tStatus=Success"));
        if (winston.level == "info") {
            winston.info(chalk.green(`Successfully converted namespace '${xmlRow.namespace}' with ID ${xmlRow.id}`));
        }
        winston.debug(JSON.stringify(newPrimaryContent, null, 4));
        //winston.debug(JSON.stringify(newSecondaryContent, null, 4));

        mongoClient.insert({id, namespace, conversionStatus, title, oldPrimaryContent, oldSecondaryContent, newPrimaryContent});
        return {id, namespace, conversionStatus, title, oldPrimaryContent, oldSecondaryContent, newPrimaryContent};
    } catch (e) {
        const conversionStatus = "ERROR";
        docConversionStatus[id] = {id, conversionStatus, conversionErrorCode: e.code, conversionErrorMessage: e.toString()};
        winston.verbose(chalk.red(`\tStatus=Error: Message=${e}`));
        winston.debug(e.payload);
        if (winston.level == "info") {
            winston.info(chalk.red(`Failed to convert namespace '${xmlRow.namespace}' with ID ${xmlRow.id}. Faced '${e}'`));
        }
        mongoClient.insert({id, namespace, conversionStatus, conversionErrorCode: e.code, conversionErrorMessage: e.toString(), conversionErrorPayload: e.payload});
    }
};

function printSummary(startTime) {
    let successCount = 0;
    let failedCount = 0;
    const errorDistribution = {};

    Object.values(docConversionStatus).forEach((d) => {
        if (d.conversionStatus == "SUCCESS") {
            successCount++;
        } else {
            failedCount++;
            if (!errorDistribution[d.conversionErrorCode]) {
                errorDistribution[d.conversionErrorCode] = [];
            }
            errorDistribution[d.conversionErrorCode].push(d.id);
        }
    });
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
    const db = new MySQLClient();
    db.connect();
    // db.query(859).then(convert).catch((err) => console.error(err));
    // db.query(4858).then(convert).catch((err) => console.error(err));
    // db.query(9427).then(convert).catch((err) => console.error(err));
    // db.query(4).then(convert).catch((err) => console.error(err));
    // db.query(5).then(convert).catch((err) => console.error(err));
    db.query(7).then(convert).catch((err) => console.error(err));
    db.releaseConnection();
}

async function mainAll() {
    const startTime = new Date().getTime();
    winston.level = "info";

    const mysqlClient = new MySQLClient();
    const mongoClient = new MongoClient();

    mysqlClient.connect()
        .then(() => mongoClient.connect())
        .then(() => mongoClient.purge())
        .then(() => {
            mysqlClient.all(
                (row) => convert(row, mongoClient), 
                () => {
                    printSummary(startTime);
                    mysqlClient.releaseConnection();
                    setTimeout(() => mongoClient.disconnect(), 1000);
                }
            );
        });
}

// mainSingle();
mainAll();

module.exports = convert;