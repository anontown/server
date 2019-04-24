import { migrateSet } from "./utils";

migrateSet
  .then(x => x.up())
  .then(() => console.log("done"))
  .catch(e => console.error("error", e));
