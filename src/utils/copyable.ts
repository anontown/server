import { delUndef } from "./del-undef";

// https://github.com/nwtgck/ts-copyable-npm

export class Copyable<T> {
  constructor(private _constructor: new (...args: any[]) => T) {
  }

  copy(partial: Partial<T>): T {
    const cloneObj: T = new this._constructor();
    return Object.assign(cloneObj, this, delUndef(partial));
  }
}
