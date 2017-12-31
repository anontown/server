import * as CryptoJS from "crypto-js";

export function hash(str: string): string {
    return (CryptoJS.SHA256(str) as any)
        .toString(CryptoJS.enc.Base64)
        .replace(/=/g, "");
}