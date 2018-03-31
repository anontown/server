import {
  AtError,
  Token,
  TokenRepo,
  TokenRepoMock,
  dbReset,
  ITokenRepo,
  ObjectIDGenerator,
  ClientRepoMock
} from "../../";

function run(repoGene: () => ITokenRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });


}

describe("TokenRepoMock", () => {
  run(() => new TokenRepoMock(new ClientRepoMock()), false);
});

describe("TokenRepo", () => {
  run(() => new TokenRepo(new ClientRepoMock()), true);
});
