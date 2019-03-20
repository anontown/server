export function isNullOrUndefined<T>(x: T | null | undefined): x is null | undefined {
  return x === null || x === undefined;
}

export function nullToUndefined<T>(x: T | null | undefined): T | undefined {
  return x === null ? undefined : x;
}