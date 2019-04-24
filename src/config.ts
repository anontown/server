import { validateData } from "./utils/string-validate";

export const Config = {
    timezone: "Asia/Tokyo",
    saveDir: process.env.SAVE_DIR || "./" as string,
    server: {
        port: Number(process.env.SERVER_PORT),
    },
    db: {
        url: process.env.DB_URL as string,
    },
    es: {
        host: process.env.ES_HOST as string,
    },
    redis: {
        url: process.env.REDIS_URL as string,
    },
    salt: {
        pass: process.env.SALT_PASS as string,
        hash: process.env.SALT_HASH as string,
        token: process.env.SALT_TOKEN as string,
        tokenReq: process.env.SALT_TOKEN_REQ as string,
    },
    recaptcha: {
        siteKey: process.env.RECAPTCHA_SITE_KET as string,
        secretKey: process.env.RECAPTCHA_SECRET_KET as string,
    },
    user: {
        sn: {
            regex: /^[a-zA-Z0-9_]{3,20}$/,
            validate: validateData(["lc", "uc", "d", "ub"], 3, 20),
            msg: "スクリーンネームは半角英数字、アンダーバー3～20文字にして下さい",
        },
        pass: {
            regex: /^[a-zA-Z0-9_]{3,50}$/,
            validate: validateData(["lc", "uc", "d", "ub"], 3, 50),
            msg: "パスワードは半角英数字、アンダーバー3～50文字にして下さい",
        },
        lvMax: 1000,
        profile: {
            name: {
                regex: /^.{1,50}$/,
                validate: validateData(null, 1, 50),
                msg: "名前は1～50文字にして下さい",
            },
            sn: {
                regex: /^[a-zA-Z0-9_]{3,20}$/,
                validate: validateData(["lc", "uc", "d", "ub"], 3, 20),
                msg: "スクリーンネームは半角英数字、アンダーバー3～20文字にして下さい",
            },
            text: {
                regex: /^[\s\S]{1,3000}$/,
                validate: validateData(null, 1, 3000),
                msg: "自己紹介文は1～3000文字にして下さい",
            },
        },
        token: {
            name: {
                regex: /^.{1,50}$/,
                validate: validateData(null, 1, 50),
                msg: "名前は1～50文字にして下さい",
            },
            req: {
                expireMinute: 5,
            },
        },
        storage: {
            key: {
                regex: /^.{1,100}$/,
                validate: validateData(null, 1, 100),
                msg: "ストレージキーは1～100文字にして下さい",
            },
            value: {
                regex: /^.{0,100000}$/,
                validate: validateData(null, 0, 100000),
                msg: "ストレージの値は0～100000文字にして下さい",
            },
        },
        client: {
            name: {
                regex: /^.{1,30}$/,
                validate: validateData(null, 1, 30),
                msg: "名前は1～30文字にして下さい",
            },
            url: {
                regex: /^https?:\/\/.{1,500}$/,
                msg: "URLが不正です",
            },
        },
    },
    topic: {
        title: {
            regex: /^.{1,100}$/,
            validate: validateData(null, 1, 100),
            msg: "タイトルは1～100文字にして下さい",
        },
        tags: {
            regex: /^[a-z0-9ぁ-んァ-ヶー一-龠々_]{1,20}$/,
            validate: validateData(["lc", "d", "hira", "kana", "han", "ub"], 1, 20),
            max: 15,
            msg: "タグは半角小文字英数字ひらがな漢字、アンダーバー1～20文字15個以内にして下さい",
        },
        text: {
            regex: /^[\s\S]{1,10000}$/,
            validate: validateData(null, 1, 10000),
            msg: "本文は1～1万文字以内にして下さい",
        },
        hashLen: 6,
    },
    res: {
        name: {
            regex: /^.{1,50}$/,
            validate: validateData(null, 1, 50),
            msg: "名前は50文字以内にして下さい",
        },
        text: {
            regex: /^[\s\S]{1,5000}$/,
            validate: validateData(null, 1, 5000),
            msg: "本文は1～5000文字にして下さい",
        },
        wait: {
            maxLv: 3,
            minSecond: 7,
            m10: 10,
            m30: 15,
            h1: 20,
            h6: 30,
            h12: 40,
            d1: 50,
        },
    },
};
