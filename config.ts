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
        sn: string,
        pass: string,
        lvMax: number,
        profile: {
            name: string,
            text: string
        },
        token: {
            name: string,
            req: {
                expireMinute: 5
            }
        },
        client: {
            name: string,
            url: string
        }
    },
    topic: {
        title: string,
        category: string,
        categoryMax: number,
        text: string
    },
    res: {
        defaultName: string,
        name: string,
        text: string,
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