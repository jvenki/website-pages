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

    save(doc) {
        this.collection.update({id: doc.id}, doc, { upsert: true });
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

    saveValidationResult(id, status, comments) {
        return this.collection.findOneAndUpdate({id}, {$set: {validationStatus: status, validationComments: comments}});
    }

    purge() {
        return this.collection.deleteMany({});
    }

    disconnect() {
        this.nativeClient.close();
    }
}


module.exports = Client;