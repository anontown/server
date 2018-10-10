import {
  MsgRepo,
} from "../../";

import { run } from "./imsg-repo.th";

describe("MsgRepo", () => {
  run(() => new MsgRepo(true), true);
});
