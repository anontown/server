import { ObjectID } from 'mongodb';

export interface IGenerator<T> {
    get(): T;
}

export const ObjectIDGenerator: IGenerator<string> = {
    get: function () {
        return new ObjectID().toString();
    }
}

export const RandomGenerator: IGenerator<string> = {
    get: function () {
        return String(Math.random());
    }
}