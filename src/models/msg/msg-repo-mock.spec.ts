import {
  MsgRepoMock,
} from "../../";

import { run } from "./imsg-repo.th";

describe("MsgRepoMock", () => {
  run(() => new MsgRepoMock(), false);
});
