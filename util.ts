var crypto = require("crypto");
export class StringUtil {
    static line(str: string, after: string = "\n"): string {
        return str.replace(/\r\n|\r|\n/, after);
    }

    static graphicEscape(str: string): string {
        let hash:{ [key: string]: string; } = {
            "★": "☆",
            "●": "○",
            "■": "□",
            "▼": "▽",
            "▲": "▲",
            "◆": "◇"
        };
        return str.replace(/[★●■▼▲◆]/g, function (match) {
            return hash[match];
        });
    }

    private static hash(algo: string, str: string): string {
        return (crypto.createHash(algo).update(str).digest('base64') as string).replace("=", "");
    }

    static hashShort(str: string): string {
        return this.hash("md5", str);
    }

    static hashLong(str: string): string {
        return this.hash("sha256", str);
    }
}