import * as migrate from "migrate";
import { promisify } from "util";
import { Config } from "../config";
import * as path from "path";

export const migrateSet: Promise<any> = promisify(migrate.load)({
  stateStore: path.join(Config.saveDir, "./data/.migrate"),
  migrationsDirectory: "dist/migrations",
  filterFunction: (s: string) => s.endsWith(".js"),
});

export function migrateUp() {
  return migrateSet.then(x => promisify(x.up).bind(x)());
}

export function migrateDown() {
  return migrateSet.then(x => promisify(x.down).bind(x)());
}
