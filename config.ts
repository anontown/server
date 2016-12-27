import * as fs from 'fs';

interface IConfig {
    server: {
        port: number
    },
    db: {
        url: string,
        user: string,
        pass: string
    },
    user: {
        sn: {
            regex: string,
            msg: string
        },
        pass: {
            regex: string,
            msg: string
        },
        lvMax: number,
        profile: {
            name: {
                regex: string,
                msg: string
            },
            text: {
                regex: string,
                msg: string
            }
        },
        token: {
            name: {
                regex: string,
                msg: string
            },
            req: {
                expireMinute: 5
            }
        },
        client: {
            name: {
                regex: string,
                msg: string
            },
            url: {
                regex: string,
                msg: string
            }
        }
    },
    topic: {
        title: {
            regex: string,
            msg: string
        },
        category: {
            regex: string,
            max: number,
            msg: string
        },
        text: {
            regex: string,
            msg: string
        }
    },
    res: {
        defaultName: string,
        name: {
            regex: string,
            msg: string
        },
        text: {
            regex: string,
            msg: string
        },
        wait: {
            maxLv: number,
            minSecond: number,
            m10: number,
            m30: number,
            h1: number,
            h6: number,
            h12: number,
            d1: number
        }
    },
    salt: {
        pass: string,
        hash: string,
        token: string,
        tokenReq: string
    }
}

export const Config: IConfig = JSON.parse(fs.readFileSync("./config.json", "utf8"));