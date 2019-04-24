import { migrateSet } from "./utils";
import { promisify } from "util";

migrateSet
  .then(x => promisify(x.up).bind(x)())
  .then(() => console.log("done"))
  .catch(e => console.error("error", e));
