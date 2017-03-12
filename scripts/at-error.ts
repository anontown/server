import { IJSONSchemaValidationError } from 'jsonschema';

export interface AtErrorItem {
    message: string;
    data: any;
}

export class AtError extends Error {
    constructor(public statusCode: StatusCode, public type: string, public errors: AtErrorItem[]) {
        super();
    }

    toString(): string {
        return JSON.stringify(this.toJSON());
    }

    toJSON() {
        return {
            statusCode: this.statusCode,
            type: this.type,
            errors: this.errors
        };
    }
}

export class AtServerError extends AtError {
    constructor() {
        super(StatusCode.InternalServerError, "server", [
            { message: "サーバー内部エラー", data: null }
        ]);
    }
}

export class AtParamTypeError extends AtError {
    constructor(data: IJSONSchemaValidationError[]) {
        super(StatusCode.MisdirectedRequest, "param_type", [
            { message: "パラメーターの型が不正です", data: data }
        ]);
    }
}

export class AtCaptchaError extends AtError {
    constructor() {
        super(StatusCode.Forbidden, "captcha", [
            { message: "キャプチャ認証に失敗", data: null }
        ]);
    }
}

export interface IParamErrorData {
    field: string;
    message: string;
}

export class AtParamsError extends AtError {
    constructor(data: IParamErrorData[]) {
        super(StatusCode.MisdirectedRequest,
            "params",
            data.map(x => ({ message: x.message, data: { field: x.field } })));
    }
}

export type paramsErrorMakerData=(() => IParamErrorData | null) | { field: string, val: string, regex: RegExp, message: string };

export function paramsErrorMaker(fs: paramsErrorMakerData[]) {
    let errors: IParamErrorData[] = [];
    fs.forEach(f => {
        if (typeof f === "function") {
            let error = f();
            if (error !== null) {
                errors.push(error);
            }
        } else {
            if (!f.regex.test(f.val)) {
                errors.push({
                    field: f.field,
                    message: f.message
                });
            }
        }
    });
    if (errors.length !== 0) {
        throw new AtParamsError(errors);
    }
}

export class AtRightError extends AtError {
    constructor(message: string) {
        super(StatusCode.Forbidden,
            "right",
            [{ message, data: null }]);
    }
}

export class AtConflictError extends AtError {
    constructor(message: string) {
        super(StatusCode.Forbidden,
            "conflict",
            [{ message, data: null }]);
    }
}

/**
 * 前提条件
 */
export class AtPrerequisiteError extends AtError {
    constructor(message: string) {
        super(StatusCode.Forbidden,
            "prerequisite",
            [{ message, data: null }]);
    }
}

/**
 * 認証に失敗
 */
export class AtTokenAuthError extends AtError {
    constructor() {
        super(StatusCode.Unauthorized,
            "token_auth",
            [{ message: "認証に失敗しました", data: null }]);
    }
}

export class AtUserAuthError extends AtError {
    constructor() {
        super(StatusCode.Unauthorized,
            "user_auth",
            [{ message: "認証に失敗しました", data: null }]);
    }
}

export class AtNotFoundError extends AtError {
    constructor(message: string) {
        super(StatusCode.NotFound,
            "not_found",
            [{ message, data: null }]);
    }
}

export class AtNotFoundPartError extends AtError {
    constructor(message: string, foundIds: string[]) {
        super(StatusCode.NotFound,
            "not_found_part",
            [{ message, data: { foundIds } }]);
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