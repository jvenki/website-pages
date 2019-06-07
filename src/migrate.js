const chalk = require("chalk");
const Database = require("./migrator/Database");
const TreeWalker = require("./migrator/TreeWalker");

const convert = (id, db, walker) => {
    db.query(id)
        .then((o) => {
            const output = walker.walk(o.title, o.primaryContent);
            console.log(chalk.blueBright.bold(JSON.stringify(output, null, 4)));
            // console.log(output);
        })
        .catch((err) => console.error(err));
}

function main() {
    const walker = new TreeWalker();
    const db = new Database();
    db.connect();
    // convert(859, db);
    convert(4858, db, walker);
    db.releaseConnection();
}

main();
