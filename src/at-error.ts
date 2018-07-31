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
            errors: this.errors,
        };
    }
}

export class AtServerError extends AtError {
    constructor() {
        super(StatusCode.InternalServerError, "server", [
            { message: "サーバー内部エラー", data: null },
        ]);
    }
}

export class AtCaptchaError extends AtError {
    constructor() {
        super(StatusCode.ClientError, "captcha", [
            { message: "キャプチャ認証に失敗", data: null },
        ]);
    }
}

export interface IParamErrorData {
    field: string;
    message: string;
}

export class AtParamsError extends AtError {
    constructor(data: IParamErrorData[]) {
        super(StatusCode.ClientError,
            "params",
            data.map(x => ({ message: x.message, data: { field: x.field } })));
    }
}

export type paramsErrorMakerData =
    (() => IParamErrorData | null)
    | { field: string, val: string, regex: RegExp, message: string };

export function paramsErrorMaker(fs: paramsErrorMakerData[]) {
    const errors: IParamErrorData[] = [];
    fs.forEach(f => {
        if (typeof f === "function") {
            const error = f();
            if (error !== null) {
                errors.push(error);
            }
        } else {
            if (!f.regex.test(f.val)) {
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
        super(StatusCode.ClientError,
            "right",
            [{ message, data: null }]);
    }
}

export class AtConflictError extends AtError {
    constructor(message: string) {
        super(StatusCode.ClientError,
            "conflict",
            [{ message, data: null }]);
    }
}

/**
 * 前提条件
 */
export class AtPrerequisiteError extends AtError {
    constructor(message: string) {
        super(StatusCode.ClientError,
            "prerequisite",
            [{ message, data: null }]);
    }
}

/**
 * 認証に失敗
 */
export class AtTokenAuthError extends AtError {
    constructor() {
        super(StatusCode.ClientError,
            "token_auth",
            [{ message: "認証に失敗しました", data: null }]);
    }
}

export class AtAuthError extends AtError {
    constructor(message: string) {
        super(StatusCode.ClientError,
            "auth",
            [{ message, data: null }]);
    }
}

export class AtUserAuthError extends AtError {
    constructor() {
        super(StatusCode.ClientError,
            "user_auth",
            [{ message: "認証に失敗しました", data: null }]);
    }
}

export class AtNotFoundError extends AtError {
    constructor(message: string) {
        super(StatusCode.ClientError,
            "not_found",
            [{ message, data: null }]);
    }
}

export enum StatusCode {
    /**
     * リクエストが不正
     */
    ClientError = 400,

    /**
     * サーバー内部エラー
     */
    InternalServerError = 500,
}
