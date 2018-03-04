export function map<T, R>(x: T | undefined, f: (x: T) => R): R | undefined {
  if (x === undefined) {
    return undefined;
  } else {
    return f(x);
  }
}