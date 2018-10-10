// undefinedのプロパティを削除
export function delUndef<T>(obj: T): T {
  const res: any = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      res[key] = val;
    }
  }
  return res;
}
