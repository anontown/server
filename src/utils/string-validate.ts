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
  char: CharType[] | null,
  min: number | null,
  max: number | null,
}

export interface ValidateDataCache {
  validate: ValidateData,
  reg: RegExp,
}

export function validateData(char: CharType[] | null, min: number | null, max: number | null): ValidateDataCache {
  const validate = {
    char,
    min,
    max,

  };
  return {
    validate,
    reg: validateToReg(validate)
  }
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
  };
}

function validateToReg(data: ValidateData): RegExp {
  const char = data.char !== null ? `[${data.char.map(x => charTypeToReg(x)).join()}]` : ".";
  const len = `{${data.min !== null ? data.min : 0},${data.max !== null ? data.max : ""}}`;
  const reg = `^${char}${len}$`;
  return new RegExp(reg, "us");
}