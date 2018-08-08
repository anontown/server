
import { ApolloError } from "apollo-server";

export interface AtErrorItem {
    message: string;
    data: any;
}

export class AtError extends ApolloError {
    constructor(public code: string, public errors: AtErrorItem[]) {
        super("error", code, { errors });
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
        super("server", [
            { message: "サーバー内部エラー", data: null },
        ]);
    }
}

export class AtCaptchaError extends AtError {
    constructor() {
        super("captcha", [
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
        super("params",
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
        super("right",
            [{ message, data: null }]);
    }
}

export class AtConflictError extends AtError {
    constructor(message: string) {
        super("conflict",
            [{ message, data: null }]);
    }
}

/**
 * 前提条件
 */
export class AtPrerequisiteError extends AtError {
    constructor(message: string) {
        super("prerequisite",
            [{ message, data: null }]);
    }
}

/**
 * 認証に失敗
 */
export class AtTokenAuthError extends AtError {
    constructor() {
        super("token_auth",
            [{ message: "認証に失敗しました", data: null }]);
    }
}

export class AtAuthError extends AtError {
    constructor(message: string) {
        super("auth",
            [{ message, data: null }]);
    }
}

export class AtUserAuthError extends AtError {
    constructor() {
        super("user_auth",
            [{ message: "認証に失敗しました", data: null }]);
    }
}

export class AtNotFoundError extends AtError {
    constructor(message: string) {
        super("not_found",
            [{ message, data: null }]);
    }
}