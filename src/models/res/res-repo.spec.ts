import {
  AtError,
  dbReset,
  IResRepo,
  Res,
  ResRepo,
  ResRepoMock,
} from "../../";

function run(repoGene: () => IResRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });
}

describe("ResRepoMock", () => {
  run(() => new ResRepoMock(), false);
});

describe("ResRepo", () => {
  run(() => new ResRepo(), true);
});
