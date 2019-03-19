import * as log4js from "log4js";
import * as path from "path";
import { Config } from "./config";

// log
log4js.configure({
    appenders: [
        {
            type: "dateFile",
            category: "system",
            filename: path.join(Config.saveDir, "logs/system.log"),
            pattern: "-yyyy-MM-dd",
        },
        {
            type: "dateFile",
            category: "access",
            filename: path.join(Config.saveDir, "logs/access.log"),
            pattern: "-yyyy-MM-dd",
        },
        {
            type: "dateFile",
            category: "error",
            filename: path.join(Config.saveDir, "logs/error.log"),
            pattern: "-yyyy-MM-dd",
        },
        {
            type: "dateFile",
            category: "app",
            filename: path.join(Config.saveDir, "logs/app.log"),
            pattern: "-yyyy-MM-dd",
        },
        ...process.env.AT_MODE === "TEST"
            ? []
            : [{
                type: "console",
            }],

    ],
});

export class Logger {
    static system = log4js.getLogger("system");
    static access = log4js.getLogger("access");
    static error = log4js.getLogger("error");
    static app = log4js.getLogger("app");
    static express = log4js.connectLogger(log4js.getLogger("access"), { level: log4js.levels.INFO });
}
