export interface IAuthTokenBase<T extends "master" | "general"> {
    readonly id: string;
    readonly key: string;
    readonly user: string;
    readonly type: T;
}

export type IAuthTokenMaster = IAuthTokenBase<"master">;
export interface IAuthTokenGeneral extends IAuthTokenBase<"general"> {
    readonly client: string;
}
export type IAuthToken = IAuthTokenMaster | IAuthTokenGeneral;

export interface IAuthUser {
    readonly id: string;
    readonly pass: string;
}
