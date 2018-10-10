import {
  ClientRepo,
} from "../../";

import { run } from "./iclient-repo.th";

describe("ClientRepo", () => {
  run(() => new ClientRepo(), true);
});
