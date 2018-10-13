/*
文字の種類
lc:小文字
uc:大文字
d:数字
ub:アンダーバー
hy:ハイフン
hira:ひらがな
kana:カタカナ
hn:漢字
*/
export type CharType = "lc" | "uc" | "d" | "ub" | "hy" | "hira" | "kana" | "hn";

export interface ValidateData {
  char: CharType,
  min: number | null,
  max: number | null,
}