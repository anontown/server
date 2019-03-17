import { Either, left, right } from "fp-ts/lib/Either";

/*
文字の種類
lc:小文字
uc:大文字
d:数字
ub:アンダーバー
hy:ハイフン
hira:ひらがな
kana:カタカナ
han:漢字
*/
export type CharType = "lc" | "uc" | "d" | "ub" | "hy" | "hira" | "kana" | "han";

export interface ValidateData {
  char: CharType[] | null;
  min: number | null;
  max: number | null;
}

export interface ValidateDataCache {
  validate: ValidateData;
  reg: RegExp;
}

export interface ValidateError {
  type: "validate";
  data: {
    validate: ValidateData,
    value: string,
  };
}

export function checkString(validate: ValidateDataCache, value: string): Either<ValidateError, string> {
  if (validate.reg.test(value)) {
    return right(value);
  } else {
    return left<ValidateError, never>({
      type: "validate",
      data: {
        validate: validate.validate,
        value,
      },
    });
  }
}

export function validateData(char: CharType[] | null, min: number | null, max: number | null): ValidateDataCache {
  const validate = {
    char,
    min,
    max,

  };
  return {
    validate,
    reg: validateToReg(validate),
  };
}

function charTypeToReg(type: CharType): string {
  switch (type) {
    case "lc":
      return "a-z";
    case "uc":
      return "A-Z";
    case "d":
      return "0-9";
    case "ub":
      return "_";
    case "hy":
      return "-";
    case "hira":
      return "\\p{Script_Extensions=Hiragana}";
    case "kana":
      return "\\p{Script_Extensions=Katakana}";
    case "han":
      return "\\p{Script_Extensions=Han}";
  }
}

function validateToReg(data: ValidateData): RegExp {
  const char = data.char !== null ? `[${data.char.map(x => charTypeToReg(x)).join("")}]` : ".";
  const len = `{${data.min !== null ? data.min : 0},${data.max !== null ? data.max : ""}}`;
  const reg = `^${char}${len}$`;
  return new RegExp(reg, "us");
}

export interface ValidateRegExpError {
  type: "validate_regexp";
  data: {
    regexp: string,
    value: string,
  };
}

export function checkRegExp(reg: RegExp, value: string): Either<ValidateRegExpError, string> {
  if (reg.test(value)) {
    return right(value);
  } else {
    return left<ValidateRegExpError, never>({
      type: "validate_regexp",
      data: {
        regexp: reg.source,
        value,
      },
    });
  }
}
