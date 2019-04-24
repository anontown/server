import { migrateDown, migrateUp } from "./migrate-set";

export async function dbReset() {
  if (process.env.AT_MODE === "TEST") {
    await migrateDown();
    await migrateUp();
  } else {
    throw new Error("dbReset:not test");
  }
}
