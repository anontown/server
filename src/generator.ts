import { ObjectID } from "mongodb";

export type IGenerator<T> = () => T;

export const ObjectIDGenerator: IGenerator<string> = () => new ObjectID().toString();

export const RandomGenerator: IGenerator<string> = () => String(Math.random());
