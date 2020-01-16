import winston from "winston";
import chalk from "chalk";

const consoleTransport = new winston.transports.Console({
    level: "info",
    format: winston.format.printf(({level, message, timestamp}) => {
        switch (level) {
            case "error": 
                return chalk.red.bold(message); 
            case "warn":
                if (message.startsWith("        ")) {
                    return chalk.yellow(message);
                }
                return chalk.yellow.bold(message); 
            case "info": 
                if (message.match(/Status = SUCCESS/)) {
                    return chalk.green.bold(message);
                } else {
                    return chalk.blue.bold(message); 
                }
            case "debug": 
                if (message.startsWith("            [")) {
                    return chalk.grey.bold(message);
                } else if (message.startsWith("            <")) {
                    return chalk.grey.dim(message);
                } else {
                    return chalk.blue(message);
                }
        }
        return message;
    })
});

const fileTransport = new winston.transports.File({
    level: "silly",
    filename: ("./migration.log"), 
    format: winston.format.printf(({level, message, timestamp}) => `${message}`)
});

const logger = winston.createLogger({
    transports: [consoleTransport, fileTransport]
});

export {logger, consoleTransport, fileTransport};
