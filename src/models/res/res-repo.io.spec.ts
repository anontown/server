import { run } from "./ires-repo.th";

import {
  ResRepo,
} from "../../";

describe("ResRepo", () => {
  run(() => new ResRepo(true), true);
});
