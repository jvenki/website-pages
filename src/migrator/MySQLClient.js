const mysql = require("mysql");


class Database {
    connect() {
        return new Promise((resolve, reject) => {
            this.connection = mysql.createConnection({host: "localhost", user: "cloud", password: "scape", database: "brint" });
            this.connection.connect();
            resolve(true);
        });
    }

    query(id, rowCallback, finalCallback) {
        this.connection.query(
            "SELECT id, namespace, detail FROM landing_page_data where enabled = 1 " + (id ? "and id = " + id : ""),
            function(error, dbRows, fields) {
                if (error) {
                    reject(error);
                    throw new Error(error);
                }
                handleQueriedResults(dbRows, rowCallback);
                finalCallback();
            }
        );
    }

    releaseConnection() {
        this.connection.end();
    }
}

const handleQueriedResults = (dbRows, callback) => {
    dbRows.some((xmlRow) => {
        callback(xmlRow);
    });
};

module.exports = Database;