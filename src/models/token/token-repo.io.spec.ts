import {
  TokenRepo,
} from "../../";

import { run } from "./itoken-repo.th";

describe("TokenRepo", () => {
  run(() => new TokenRepo(), true);
});