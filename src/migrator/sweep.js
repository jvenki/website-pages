const MySQLClient = require("./MySQLClient");
const LpdXml2Json = require("./LpdXml2Json");
const winston = require("winston");
const chalk = require("chalk");
const MongoClient = require("./MongoClient");

winston.add(new winston.transports.Console({format: winston.format.simple()}));

const docConversionStatus = {};

const startSweeping = () => {
    const startTime = new Date().getTime();
    winston.level = "info";

    const mysqlClient = new MySQLClient();
    const mongoClient = new MongoClient();

    mysqlClient.connect()
        .then(() => mongoClient.connect())
        .then(() => mongoClient.purge())
        .then(() => {
            mysqlClient.query(
                undefined,
                (row) => processOneRow(row, mongoClient), 
                () => {
                    printSummary(startTime);
                    mysqlClient.releaseConnection();
                    setTimeout(() => mongoClient.disconnect(), 1000);
                }
            );
        });
};

const processOneRow = (xml, mongoClient) => {
    const output = new LpdXml2Json().toJSON(xml);
    const {id, namespace, conversionStatus, conversionErrorCode, conversionErrorMessage} = output;
    docConversionStatus[id] = {id, conversionStatus, conversionErrorCode, conversionErrorMessage};
    mongoClient.insert(output);
    if (conversionStatus == "SUCCESS") {
        winston.verbose(chalk.green("\tStatus=Success"));
        if (winston.level == "info") {
            winston.info(chalk.green(`Successfully converted namespace '${namespace}' with ID ${id}`));
        }
    } else {
        winston.verbose(chalk.red(`\tStatus=Error: Message=${conversionErrorMessage}`));
        if (winston.level == "info") {
            winston.info(chalk.red(`Failed to convert namespace '${namespace}' with ID ${id}. Faced '${conversionErrorMessage}'`));
        }
    }
};

const printSummary = (startTime) => {
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
    winston.info(chalk.blue.bold(`Success = ${successCount} : Failed = ${failedCount} : Time Taken = ${new Date().getTime() - startTime}`));
    winston.info(chalk.red.bold("Summary - Distribution of Error Codes"));
    Object.keys(errorDistribution).forEach((key) => {
        winston.info(chalk.red(`\t${key} = ${errorDistribution[key].length}`));
    });
    winston.info(chalk.red.bold("Summary - Affecting IDs across Error Codes"));
    Object.keys(errorDistribution).forEach((key) => {
        winston.info(chalk.red(`\t${key} = ${errorDistribution[key]}`));
    });
};

startSweeping();
