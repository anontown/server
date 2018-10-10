import {
  TokenRepoMock,
} from "../../";

import { run } from "./itoken-repo.th";

describe("TokenRepoMock", () => {
  run(() => new TokenRepoMock(), false);
});
