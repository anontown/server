import { ObjectOmit } from "typelevel-ts";
import {
  IHttpAPICall,
  IHttpAPICallParams,
  IHttpAPIParams,
  ISocketAPICall,
  ISocketAPICallParams,
  ISocketAPIParams,
} from "./app-server";

export const httpAPIs = Symbol();
export const socketAPIs = Symbol();

export type IHttpAPIDecoratorParams<P, R> = ObjectOmit<IHttpAPIParams<P, R>, "call">;
export type ISocketAPIDecoratorParams<P, R> = ObjectOmit<ISocketAPIParams<P, R>, "call">;

export interface APIDatas {
  [httpAPIs]?: IHttpAPIParams<any, any>[];
  [socketAPIs]?: ISocketAPIParams<any, any>[];
}

export function controller<T extends { new(...args: any[]): any }>(target: T): T {
  return target;
}

// TODO:型推論がめんどうなので初期値をanyにしてるけどそのうち改善
export function http<P= any, R= any>(value: IHttpAPIDecoratorParams<P, R>) {
  return (target: any, _propertyKey: string, descriptor: TypedPropertyDescriptor<IHttpAPICall<P, R>>) => {
    if (!target[httpAPIs]) {
      target[httpAPIs] = [];
    }
    target[httpAPIs].push({ ...value, call: (params: IHttpAPICallParams<P>) => descriptor.value!(params) });
  };
}

// TODO:型推論がめんどうなので初期値をanyにしてるけどそのうち改善
export function socket<P= any, R= any>(value: ISocketAPIDecoratorParams<P, R>) {
  return (target: any, _propertyKey: string, descriptor: TypedPropertyDescriptor<ISocketAPICall<P, R>>) => {
    if (!target[socketAPIs]) {
      target[socketAPIs] = [];
    }
    target[socketAPIs].push({ ...value, call: (params: ISocketAPICallParams<P>) => descriptor.value!(params) });
  };
}
