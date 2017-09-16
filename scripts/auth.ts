export interface IAuthTokenBase<T extends 'master' | 'general'> {
    id: string,
    key: string,
    user: string,
    type: T
}

export type IAuthTokenMaster = IAuthTokenBase<'master'>;
export interface IAuthTokenGeneral extends IAuthTokenBase<'general'> {
    client: string
}
export type IAuthToken = IAuthTokenMaster | IAuthTokenGeneral;

export interface IAuthUser {
    id: string,
    pass: string;
}