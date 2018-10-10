import { run } from "./ires-repo.th";

import {
  ResRepoMock,
} from "../../";

describe("ResRepoMock", () => {
  run(() => new ResRepoMock(), false);
});
