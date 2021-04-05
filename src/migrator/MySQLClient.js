import mysql from "mysql";
import {logger} from "./Logger";

export default class MySQLClient {
    connect() {
        return new Promise((resolve, reject) => {
            this.connection = mysql.createConnection({host: "localhost", user: "cloud", password: "scape", database: "brint" });
            this.connection.connect();
            resolve(true);
        });
    }

    query(criteria) {
        let query = "SELECT id, namespace, detail FROM landing_page_data where enabled = 1 and landing_page_type != 'PERMANENT_REDIRECT' and landing_page_type != 'REWRITE'";
        if (criteria.restrictToIds && criteria.restrictToIds.length > 0) {
            query += ` AND id IN (${criteria.restrictToIds.join(", ")})`;
        } else {
            query += ` AND id BETWEEN ${criteria.idRange.split(",")[0]} AND ${criteria.idRange.split(",")[1]}`;
        }
        if (criteria.ignoreIds && criteria.ignoreIds.length > 0) {
            query += ` AND id NOT IN (${criteria.ignoreIds})`;
        }

        query += " ORDER BY id";
        logger.verbose("Querying all LPDs using " + query);
        return new Promise((resolve, reject) => {
            this.connection.query(
                query,
                function(error, dbRows) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    if (criteria.restrictToIds && criteria.restrictToIds.length > 0) {
                        dbRows.sort((r1, r2) => criteria.restrictToIds.indexOf(r1.id) - criteria.restrictToIds.indexOf(r2.id));
                    }
                    resolve(dbRows);
                }
            );
        });        
    }

    releaseConnection() {
        this.connection.end();
    }
}
