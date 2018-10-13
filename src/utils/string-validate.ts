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
  char: CharType,
  min: number | null,
  max: number | null,
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

}