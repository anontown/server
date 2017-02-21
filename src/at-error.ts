export class AtError extends Error {
    statusCode: StatusCode;

    constructor(statusCode: StatusCode, message: string) {
        super(message);
        super.name = "AtError";
        this.statusCode = statusCode;
    }

    toString(): string {
        return super.message;
    }
}

export enum StatusCode {
    /**
     * 認証が必要
     */
    Unauthorized = 401,

    /**
     * 拒否
     */
    Forbidden = 402,

    /**
     * 見つからない
     */
    NotFound = 404,

    /**
     * 競合
     */
    Conflict = 409,

    /**
     * パラメーターが不正
     */
    MisdirectedRequest = 421,

    /**
     * サーバー内部エラー
     */
    InternalServerError = 500,



}