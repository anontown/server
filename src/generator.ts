import { ObjectID } from "mongodb";
import nanoid from "nanoid";

export type IGenerator<T> = () => T;

export const ObjectIDGenerator: IGenerator<string> = () => new ObjectID().toString();

export const RandomGenerator: IGenerator<string> = () => nanoid();
