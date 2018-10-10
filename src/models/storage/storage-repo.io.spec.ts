import {
  StorageRepo,
} from "../../";

import { run } from "./istorage-repo.th";

describe("StorageRepo", () => {
  run(() => new StorageRepo(), true);
});
