import {
  AtError,
  Profile,
  ProfileRepo,
  ProfileRepoMock,
  dbReset,
  IProfileRepo,
  ObjectIDGenerator,
} from "../../";

function run(repoGene: () => IProfileRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });

}

describe("ProfileRepoMock", () => {
  run(() => new ProfileRepoMock(), false);
});

describe("ProfileRepo", () => {
  run(() => new ProfileRepo(), true);
});
