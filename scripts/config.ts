let dbUser = process.env['DB_USER'] as string | undefined;
let dbPass = process.env['DB_PASS'] as string | undefined;


export const Config = {
    server: {
        port: Number(process.env['PORT'])
    },
    db: {
        url: process.env['DB_URL'] as string,
        auth: dbUser !== undefined && dbPass !== undefined ?
            {
                user: dbUser,
                pass: dbPass
            } :
            null
    },
    salt: {
        pass: process.env['SALT_PASS'] as string,
        hash: process.env['SALT_HASH'] as string,
        token: process.env['SALT_TOKEN'] as string,
        tokenReq: process.env['SALT_TOKEN_REQ'] as string
    },
    recaptcha: {
        siteKey: process.env['RECAPTCHA_SITE_KET'] as string,
        secretKey: process.env['RECAPTCHA_SECRET_KET'] as string
    },
    user: {
        sn: {
            regex: /^[a-zA-Z0-9_]{3,20}$/,
            msg: "スクリーンネームは半角英数字、アンダーバー3～20文字にして下さい"
        },
        pass: {
            regex: /^[a-zA-Z0-9_]{3,50}$/,
            msg: "パスワードは半角英数字、アンダーバー3～50文字にして下さい"
        },
        lvMax: 1000,
        profile: {
            name: {
                regex: /^.{1,50}$/,
                msg: "名前は1～50文字にして下さい"
            },
            sn: {
                regex: /^[a-zA-Z0-9_]{3,20}$/,
                msg: "スクリーンネームは半角英数字、アンダーバー3～20文字にして下さい"
            },
            text: {
                regex: /^[\s\S]{1,3000}$/,
                msg: "自己紹介文は1～3000文字にして下さい"
            }
        },
        token: {
            name: {
                regex: /^.{1,50}$/,
                msg: "名前は1～50文字にして下さい"
            },
            req: {
                expireMinute: 5
            },
            storage: {
                regex: /^[a-z0-9_]{1,20}$/,
                msg: "ストレージ名は半角英数字、アンダーバー1～20文字にして下さい"
            }
        },
        client: {
            name: {
                regex: /^.{1,30}$/,
                msg: "名前は1～30文字にして下さい"
            },
            url: {
                regex: /^https?:\/\/.{1,500}$/,
                msg: "URLが不正です"
            }
        }
    },
    topic: {
        title: {
            regex: /^.{1,100}$/,
            msg: "タイトルは1～100文字にして下さい"
        },
        tags: {
            regex: /^[a-z0-9ぁ-んァ-ヶー一-龠々_]{1,15}$/,
            max: 10,
            msg: "タグは半角小文字英数字、アンダーバー1～15文字10階層以内にして下さい"
        },
        text: {
            regex: /^[\s\S]{1,10000}$/,
            msg: "本文は1～1万文字以内にして下さい"
        }
    },
    res: {
        name: {
            regex: /^.{0,50}$/,
            msg: "名前は50文字以内にして下さい"
        },
        text: {
            regex: /^[\s\S]{1,5000}$/,
            msg: "本文は1～5000文字にして下さい"
        },
        wait: {
            maxLv: 3,
            minSecond: 30,
            m10: 5,
            m30: 10,
            h1: 15,
            h6: 20,
            h12: 35,
            d1: 50
        }
    }
};