import {
  AtError,
  Client,
  ClientRepo,
  ClientRepoMock,
  dbReset,
  IClientRepo,
  ObjectIDGenerator,
  UserRepo,
  UserRepoMock,
  IUserRepo,
} from "../../";

function run(repoGene: () => IUserRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });
}

describe("UserRepoMock", () => {
  run(() => new UserRepoMock(), false);
});

describe("UserRepo", () => {
  run(() => new UserRepo(), true);
});
