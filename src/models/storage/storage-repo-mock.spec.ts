import {
  StorageRepoMock,
} from "../../";

import { run } from "./istorage-repo.th";

describe("StorageRepoMock", () => {
  run(() => new StorageRepoMock(), false);
});
