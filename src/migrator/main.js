const Database = require("./Database");
const DomWalker = require("./DomWalker");
const Cleanser = require("./Cleanser");
const DocCreator = require("./DocCreator");
const winston = require("winston");

const console = new winston.transports.Console({format: winston.format.simple()}); 
winston.add(console);

const convert = (id, db) => {
    return db.query(id)
        .then((o) => {
            winston.info(`Converting ${o.id} with namespace ${o.namespace}`);

            const debugInfo = [];
            const cleansedPrimaryHtml = new Cleanser().cleanse(o.primaryContent);
            const convertedPrimaryDoc = DomWalker.for(cleansedPrimaryHtml).forCreatingDoc(new DocCreator()).startWalking(debugInfo);

            // const cleansedSecondaryHtml = new Cleanser().cleanse(o.secondaryContent);
            // const convertedSecondaryDoc = DomWalker.for(cleansedSecondaryHtml).forCreatingDoc(new DocCreator()).startWalking(debugInfo);

            winston.info("\tStatus=Success");
            //winston.debug(JSON.stringify(convertedPrimaryDoc, null, 4));
            //winston.debug(JSON.stringify(convertedSecondaryDoc, null, 4));
            
            return {
                title: o.title, 
                original: {primaryContent: o.primaryContent, secondaryContent: o.secondaryContent}, 
                converted: {primaryContent: convertedPrimaryDoc, secondaryContent: {}},
                debug: debugInfo

            };
        })
        .catch((err) => console.error(err));
};

function main() {
    const db = new Database();
    db.connect();
    convert(859, db);
    // convert(4858, db);
    // convert(9427, db);
    db.releaseConnection();
}

main();

module.exports = convert;