import {
  ProfileRepoMock,
} from "../../";

import { run } from "./iprofile-repo.th";

describe("ProfileRepoMock", () => {
  run(() => new ProfileRepoMock(), false);
});
