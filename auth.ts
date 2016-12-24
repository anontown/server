import { ObjectID } from 'mongodb';

export interface IAuthToken {
    id: ObjectID,
    key: string,
    user: ObjectID
}

export interface IAuthUser {
    id: ObjectID,
    pass: string;
}