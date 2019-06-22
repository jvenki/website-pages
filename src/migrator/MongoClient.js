const MongoNativeClient = require("mongodb").MongoClient;
const winston = require("winston");

class Client {
    connect() {
        return MongoNativeClient.connect("mongodb://localhost:27017")
            .then((client) => {
                winston.info("Connected successfully to MongoDB");
                const db = client.db("pages");
                this.nativeClient = client;
                this.collection = db.collection("pages");
            })
            .catch((err) => {
                console.error(err);
            });
    }

    insert(doc) {
        this.collection.insertOne(doc);
    }

    get(id) {
        return this.collection.findOne({id: parseInt(id)});
    }

    getAll(startingOffset) {
        return new Promise((resolve, reject) => {
            const rows = this.collection.find({}).sort({id: 1}).skip(startingOffset || 0).limit(50).toArray();
            resolve(rows);
        });
    }

    purge() {
        return this.collection.deleteMany({});
    }

    disconnect() {
        this.nativeClient.close();
    }
}


module.exports = Client;