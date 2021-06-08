const MongoNativeClient = require("mongodb").MongoClient;
import {logger} from "./Logger";
import {cloneDeep} from "lodash";

export default class MongoDBClient {

    constructor(dbName, collection) {
        this.dbName = dbName;
        this.collection = collection;
    }

    connect() {
        return MongoNativeClient.connect("mongodb://localhost:27017")
            .then((client) => {
                logger.verbose("Connected successfully to MongoDB");
                const db = client.db(this.dbName);
                this.nativeClient = client;
                this.collection = db.collection(this.collection);
            })
            .catch((err) => {
                console.error(err);
            });
    }

    save(doc) {
        console.log("saving")
        console.log(doc.id);
        const serializeError = (err) => ({code: err.code, message: err.message, payload: err.payload});
        const serializedDoc = cloneDeep(doc);
        if (serializedDoc.conversionError) {
            serializedDoc.conversionError = serializeError(serializedDoc.conversionError);
        }
        if (serializedDoc.conversionIssues) {
            serializedDoc.conversionIssues = serializedDoc.conversionIssues.map((i) => serializeError(i));
        }
        return this.collection.replaceOne({id: serializedDoc.id}, serializedDoc, { upsert: true });
    }

    get(id) {
        return this.collection.findOne({id: parseInt(id)});
    }

    getAll(ids) {
        return this.collection.find({id: {$in: ids}}).toArray();
    }

    getAllFromOffset(startingOffset) {
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
