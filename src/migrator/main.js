const chalk = require("chalk");
const Database = require("./Database");
const DomWalker = require("./DomWalker");
const Cleanser = require("./Cleanser");
const DocCreator = require("./DocCreator");

const convert = (id, db) => {
    db.query(id)
        .then((o) => {
            const cleansedHtml = new Cleanser().cleanse(o.primaryContent);
            const convertedDoc = DomWalker.for(cleansedHtml).forCreatingDoc(new DocCreator()).startWalking();
            console.log(chalk.blueBright.bold(JSON.stringify(convertedDoc, null, 4)));
            // console.log(chalk.blueBright.bold(convertedDoc));
            // console.log(chalk.blueBright.bold(JSON.stringify({
            //     ...convertedDoc, 
            //     sections: convertedDoc.sections.map((s) => ({
            //         title: s.title, 
            //         mainBody: s.mainBody ? "YES" : "NO", 
            //         elements: s.elements.map((e) => e && e.type)
            //     }))
            // }, null, 4)));
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
