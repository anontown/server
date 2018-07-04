export * from "./app-server";
export * from "./decorator";
export * from "./server";
export * from "./context";

export interface DateType {
  date: Date,
  type: "gt" | "gte" | "lt" | "lte"
}