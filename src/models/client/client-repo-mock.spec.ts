import {
  ClientRepoMock,
} from "../../";

import { run } from "./iclient-repo.th";

describe("ClientRepoMock", () => {
  run(() => new ClientRepoMock(), false);
});