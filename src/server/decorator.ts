import { ObjectOmit } from "typelevel-ts";
import {
  IHttpAPIParams,
  ISocketAPIParams,
  IHttpAPICall,
  ISocketAPICall,
  IHttpAPICallParams,
  ISocketAPICallParams
} from "./app-server";

export const httpAPIs = Symbol();
export const socketAPIs = Symbol();

export type IHttpAPIDecoratorParams<P, R> = ObjectOmit<IHttpAPIParams<P, R>, "call">;
export type ISocketAPIDecoratorParams<P, R> = ObjectOmit<ISocketAPIParams<P, R>, "call">;

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

//TODO:型推論がめんどうなので初期値をanyにしてるけどそのうち改善
export function http<P=any, R=any>(value: IHttpAPIDecoratorParams<P, R>) {
  return (target: any, _propertyKey: string, descriptor: TypedPropertyDescriptor<IHttpAPICall<P, R>>) => {
    target[httpAPIs].push({ ...value, call: (params: IHttpAPICallParams<P>) => descriptor.value!(params) });
  };
}

//TODO:型推論がめんどうなので初期値をanyにしてるけどそのうち改善
export function socket<P=any, R=any>(value: ISocketAPIDecoratorParams<P, R>) {
  return (target: any, _propertyKey: string, descriptor: TypedPropertyDescriptor<ISocketAPICall<P, R>>) => {
    target[socketAPIs].push({ ...value, call: (params: ISocketAPICallParams<P>) => descriptor.value!(params) });
  };
}
