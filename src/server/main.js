const express = require("express");
const cors = require("cors");

const Database = require("../migrator/Database");
const DomWalker = require("../migrator/DomWalker");
const Cleanser = require("../migrator/Cleanser");
const DocCreator = require("../migrator/DocCreator");


const db = new Database();
db.connect();

const app = express();
app.use(cors());
const port = 8083;
app.get("/lpd/:id", (req, res) => {
    db.query(req.params.id)
        .then((o) => {
            const cleansedHtml = new Cleanser().cleanse(o.primaryContent);
            const convertedDoc = DomWalker.for(cleansedHtml).forCreatingDoc(new DocCreator()).startWalking();
            res.send({original: o, converted: {primaryContent: convertedDoc}});
        });
});

app.listen(port, () => console.log(`HungryForMore Migration Server started on ${port}!`));