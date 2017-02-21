import { ObjectID } from 'mongodb';

export interface IGenerator<T> {
    get(): T;
}

export const ObjectIDGenerator: IGenerator<ObjectID> = {
    get: function () {
        return new ObjectID();
    }
}

export const RandomGenerator: IGenerator<string> = {
    get: function () {
        return String(Math.random());
    }
}