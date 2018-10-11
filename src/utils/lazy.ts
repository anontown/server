import { Option, none, some } from "fp-ts/lib/Option";

export function lazy<T>(f: () => T) {
  let v: Option<T> = none;
  return () => {
    if (v.isSome()) {
      return v.value;
    } else {
      const val = f();
      v = some(val);
      return val;
    }
  };
}