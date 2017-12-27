import { ObjectID } from "mongodb";

export interface IGenerator<T> {
    get(): T;
}

export const ObjectIDGenerator: IGenerator<string> = {
    get() {
        return new ObjectID().toString();
    },
};

export const RandomGenerator: IGenerator<string> = {
    get() {
        return String(Math.random());
    },
};
