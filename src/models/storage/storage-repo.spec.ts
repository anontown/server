import {
  AtError,
  dbReset,
  ITokenRepo,
  ObjectIDGenerator,
  StorageRepo,
  StorageRepoMock,
  IStorageRepo,
} from "../../";


function run(repoGene: () => IStorageRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });
}

describe("StorageRepoMock", () => {
  run(() => new StorageRepoMock(), false);
});

describe("StorageRepo", () => {
  run(() => new StorageRepo(), true);
});
