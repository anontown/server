import { Option } from "fp-ts/lib/Option";

export const AtErrorSymbol = Symbol("AtError");

export interface AtErrorItem {
    message: string;
    data: any;
}

export interface AtErrorPublic {
    code: string;
    message: string;
    data: any;
}

export class AtError extends Error {
    [AtErrorSymbol] = true;
    constructor(public data: AtErrorPublic) {
        super(data.message);
    }
}

export class AtServerError extends AtError {
    constructor() {
        super({
            code: "server",
            message: "サーバー内部エラー",
            data: null,
        });
    }
}

export class AtCaptchaError extends AtError {
    constructor() {
        super({
            code: "captcha",
            message: "キャプチャ認証に失敗",
            data: null,
        });
    }
}

export interface IParamErrorData {
    field: string;
    message: string;
}

export class AtParamsError extends AtError {
    constructor(data: IParamErrorData[]) {
        super({
            code: "params",
            message: "パラメーターが不正です",
            data: data.map(x => ({ message: x.message, data: { field: x.field } })),
        });
    }
}

export type paramsErrorMakerData =
    (() => IParamErrorData | null)
    | { field: string, val: string | undefined | null | Option<string>, regex: RegExp, message: string };

export function paramsErrorMaker(fs: paramsErrorMakerData[]) {
    const errors: IParamErrorData[] = [];
    fs.forEach(f => {
        if (typeof f === "function") {
            const error = f();
            if (error !== null) {
                errors.push(error);
            }
        } else {
            if (typeof f.val === "string" && !f.regex.test(f.val)) {
                errors.push({
                    field: f.field,
                    message: f.message,
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
        super({
            code: "right",
            message,
            data: null,
        });
    }
}

export class AtConflictError extends AtError {
    constructor(message: string) {
        super({
            code: "conflict",
            message,
            data: null,
        });
    }
}

/**
 * 前提条件
 */
export class AtPrerequisiteError extends AtError {
    constructor(message: string) {
        super({
            code: "prerequisite",
            message,
            data: null,
        });
    }
}

/**
 * 認証に失敗
 */
export class AtTokenAuthError extends AtError {
    constructor() {
        super({
            code: "token_auth",
            message: "認証に失敗しました",
            data: null,
        });
    }
}

export class AtAuthError extends AtError {
    constructor(message: string) {
        super({
            code: "auth",
            message,
            data: null,
        });
    }
}

export class AtUserAuthError extends AtError {
    constructor() {
        super({
            code: "user_auth",
            message: "認証に失敗しました",
            data: null,
        });
    }
}

export class AtNotFoundError extends AtError {
    constructor(message: string) {
        super({
            code: "not_found",
            message,
            data: null,
        });
    }
}
