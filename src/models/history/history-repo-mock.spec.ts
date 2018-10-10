import {
  HistoryRepoMock,
} from "../../";

import { run } from "./ihistory-repo.th";

describe("HistoryRepoMock", () => {
  run(() => new HistoryRepoMock(), false);
});
