import { ObjectOmit } from "typelevel-ts";
import { ISocketAPIParams, IHttpAPIParams } from "./app-server";

export const httpAPIs = Symbol();
export const socketAPIs = Symbol();

export type IHttpAPIDecoratorParams = ObjectOmit<IHttpAPIParams<any, any>, "call">;
export type ISocketAPIDecoratorParams = ObjectOmit<ISocketAPIParams<any, any>, "call">;

export interface APIDatas {
  [httpAPIs]: IHttpAPIParams<any, any>[];
  [socketAPIs]: ISocketAPIParams<any, any>[];
}

export function controller<T extends { new(...args: any[]): {} }>(target: T): T & APIDatas {
  return class extends target {
    [httpAPIs] = [];
    [socketAPIs] = [];
  } as any;
}

export function http(value: IHttpAPIDecoratorParams) {
  return function (target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    target[httpAPIs].push({ ...value, call: (...p: any[]) => descriptor.value(...p) });
  };
}


export function socket(value: ISocketAPIDecoratorParams) {
  return function (target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    target[socketAPIs].push({ ...value, call: (...p: any[]) => descriptor.value(...p) });
  };
}
