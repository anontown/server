import { migrateUp } from "./utils";

migrateUp()
  .then(() => {
    console.log("done");
    process.exit(0);
  })
  .catch(e => {
    console.error("error", e);
    process.exit(-1);
  });
