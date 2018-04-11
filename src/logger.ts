import * as log4js from "log4js";

// log
log4js.configure({
    appenders: [
        {
            type: "dateFile",
            category: "system",
            filename: "logs/system.log",
            pattern: "-yyyy-MM-dd",
        },
        {
            type: "dateFile",
            category: "access",
            filename: "logs/access.log",
            pattern: "-yyyy-MM-dd",
        },
        {
            type: "dateFile",
            category: "error",
            filename: "logs/error.log",
            pattern: "-yyyy-MM-dd",
        },
        {
            type: "dateFile",
            category: "app",
            filename: "logs/app.log",
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
