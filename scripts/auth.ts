import { ObjectID } from 'mongodb';

export interface IAuthTokenBase<T extends 'master'|'general'> {
    id: ObjectID,
    key: string,
    user: ObjectID,
    type:T
}

export type IAuthTokenMaster=IAuthTokenBase<'master'>;
export type IAuthTokenGeneral=IAuthTokenBase<'general'>;
export type IAuthToken=IAuthTokenMaster|IAuthTokenGeneral;

export interface IAuthUser {
    id: ObjectID,
    pass: string;
}