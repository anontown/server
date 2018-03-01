import { ObjectOmit } from "typelevel-ts";
import { ISocketAPIParams, IHttpAPIParams } from "./app-server";

export const httpAPIs = Symbol();
export const socketAPIs = Symbol();

export type IHttpAPIDecoratorParams = ObjectOmit<IHttpAPIParams<any, any>, "call">;
export type ISocketAPIDecoratorParams = ObjectOmit<ISocketAPIParams<any, any>, "call">;

export type IHttpAPIData = IHttpAPIDecoratorParams & { key: string };
export type ISocketAPIData = ISocketAPIDecoratorParams & { key: string };

export interface APIDatas {
  [httpAPIs]: IHttpAPIData[];
  [socketAPIs]: ISocketAPIData[];
}

export function controller<T extends { new(...args: any[]): {} }>(target: T): T & APIDatas {
  return class extends target {
    [httpAPIs] = [];
    [socketAPIs] = [];
  } as any;
}

export function http(value: IHttpAPIDecoratorParams) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    target[httpAPIs].push({ ...value, key: propertyKey });
  };
}


export function socket(value: IHttpAPIDecoratorParams) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    target[socketAPIs].push({ ...value, key: propertyKey });
  };
}
