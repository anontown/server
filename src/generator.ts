import { ObjectID } from "mongodb";

export interface IGenerator<T> {
    (): T;
}

export const ObjectIDGenerator: IGenerator<string> = () => new ObjectID().toString();

export const RandomGenerator: IGenerator<string> = () => String(Math.random());
