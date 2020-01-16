const MongoNativeClient = require("mongodb").MongoClient;
import {logger} from "./Logger";
import {cloneDeep} from "lodash";

export default class MongoDBClient {
    connect() {
        return MongoNativeClient.connect("mongodb://localhost:27017")
            .then((client) => {
                logger.verbose("Connected successfully to MongoDB");
                const db = client.db("pages");
                this.nativeClient = client;
                this.collection = db.collection("pages");
            })
            .catch((err) => {
                console.error(err);
            });
    }

    save(doc) {
        const serializeError = (err) => ({code: err.code, message: err.message, payload: err.payload});
        const seriliazedDoc = cloneDeep(doc);
        if (seriliazedDoc.conversionError) {
            seriliazedDoc.conversionError = serializeError(seriliazedDoc.conversionError);
        }
        if (seriliazedDoc.conversionIssues) {
            seriliazedDoc.conversionIssues = seriliazedDoc.conversionIssues.map((i) => serializeError(i));
        }
        return this.collection.replaceOne({id: seriliazedDoc.id}, seriliazedDoc, { upsert: true });
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
