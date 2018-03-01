import { ObjectOmit } from "typelevel-ts";
import { IHttpAPIParams, ISocketAPIParams } from "./app-server";

export const httpAPIs = Symbol();
export const socketAPIs = Symbol();

export type IHttpAPIDecoratorParams = ObjectOmit<IHttpAPIParams<any, any>, "call">;
export type ISocketAPIDecoratorParams = ObjectOmit<ISocketAPIParams<any, any>, "call">;

export interface APIDatas {
  [httpAPIs]: Array<IHttpAPIParams<any, any>>;
  [socketAPIs]: Array<ISocketAPIParams<any, any>>;
}

export function controller<T extends { new(...args: any[]): any }>(target: T): T {
  return class extends target {
    [httpAPIs] = [];
    [socketAPIs] = [];
  };
}

export function http(value: IHttpAPIDecoratorParams) {
  return (target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
    target[httpAPIs].push({ ...value, call: (...p: any[]) => descriptor.value(...p) });
  };
}

export function socket(value: ISocketAPIDecoratorParams) {
  return (target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
    target[socketAPIs].push({ ...value, call: (...p: any[]) => descriptor.value(...p) });
  };
}
