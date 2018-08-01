/* tslint:disable:no-var-requires */
require("source-map-support").install();
import * as fs from "fs-promise";
import { createDB } from "./create-db";
import { } from "./generator";
import {
  Repo,
} from "./models";
import { serverRun } from "./server";

/* tslint:disable:no-floating-promises */
(async () => {
  // フォルダ作成
  try {
    await fs.mkdir("logs");
  } catch {
    /* tslint:disable:no-empty */
  }

  try {
    await fs.mkdir("data");
  } catch {
    /* tslint:disable:no-empty */
  }

  await createDB();

  await serverRun(new Repo());
})();
