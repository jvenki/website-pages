const Database = require("./Database");
const DomWalker = require("./DomWalker");
const Cleanser = require("./Cleanser");
const DocCreator = require("./DocCreator");

const convert = (id, db) => {
    return db.query(id)
        .then((o) => {
            const cleansedPrimaryHtml = new Cleanser().cleanse(o.primaryContent);
            const convertedPrimaryDoc = DomWalker.for(cleansedPrimaryHtml).forCreatingDoc(new DocCreator()).startWalking();
            // const cleansedSecondaryHtml = new Cleanser().cleanse(o.secondaryContent);
            // const convertedSecondaryDoc = DomWalker.for(cleansedSecondaryHtml).forCreatingDoc(new DocCreator()).startWalking();

            return {title: o.title, original: o, converted: {primaryContent: convertedPrimaryDoc, secondaryContent: {}}};
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