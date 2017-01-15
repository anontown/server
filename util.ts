var crypto = require("crypto");
import * as marked from 'marked';

export class StringUtil {
    static line(str: string, after: string = "\n"): string {
        return str.replace(/\r\n|\r|\n/, after);
    }

    static graphicEscape(str: string): string {
        let hash: { [key: string]: string; } = {
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

    static hash(str: string): string {
        return (crypto.createHash("sha256").update(str).digest('base64') as string).replace(/=/g, "");
    }

    static md(value: string): string {
        return marked.parse(value, { sanitize: true, breaks: true });
    }
}