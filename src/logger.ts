import * as log4js from "log4js";
import * as path from "path";
import { Config } from "./config";

// log
log4js.configure({
    appenders: {
        system: {
            type: "dateFile",
            filename: path.join(Config.saveDir, "logs/system.log"),
            pattern: "-yyyy-MM-dd",
        },
        access: {
            type: "dateFile",
            filename: path.join(Config.saveDir, "logs/access.log"),
            pattern: "-yyyy-MM-dd",
        },
        error: {
            type: "dateFile",
            filename: path.join(Config.saveDir, "logs/error.log"),
            pattern: "-yyyy-MM-dd",
        },
        app: {
            type: "dateFile",
            filename: path.join(Config.saveDir, "logs/app.log"),
            pattern: "-yyyy-MM-dd",
        },
    },
    categories: { default: { appenders: ["system", "access", "error", "app"], level: "info" } },
});

export class Logger {
    static system = log4js.getLogger("system");
    static access = log4js.getLogger("access");
    static error = log4js.getLogger("error");
    static app = log4js.getLogger("app");
    static express = log4js.connectLogger(log4js.getLogger("access"), { level: "info" });
}
