import { migrateUp } from "./utils";

migrateUp()
  .then(() => console.log("done"))
  .catch(e => console.error("error", e));
