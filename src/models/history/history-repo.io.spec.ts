import {
  HistoryRepo,
} from "../../";

import { run } from "./ihistory-repo.th";

describe("HistoryRepo", () => {
  run(() => new HistoryRepo(true), true);
});
