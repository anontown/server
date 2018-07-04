export * from "./app-server";
export * from "./decorator";
export * from "./server";
export * from "./context";

export interface DateType {
  date: string,
  type: "gt" | "gte" | "lt" | "lte"
}