const mysql = require("mysql");


class Database {
    connect() {
        this.connection = mysql.createConnection({host: "localhost", user: "cloud", password: "scape", database: "brint" });
        this.connection.connect();
    }

    query(id) {
        return new Promise((resolve, reject) => {
            this.connection.query(
                "SELECT id, namespace, detail FROM landing_page_data WHERE id = " + String(id), 
                function(error, dbRows, fields) {
                    if (error) {
                        reject(error);
                        throw new Error(error);
                    }
                    handleQueriedResults(dbRows, resolve);
                }
            );
        });
    }

    all(rowCallback, finalCallback) {
        this.connection.query(
            "SELECT id, namespace, detail FROM landing_page_data where enabled = 1",
            function(error, dbRows, fields) {
                if (error) {
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