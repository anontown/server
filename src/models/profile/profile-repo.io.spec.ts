import {
  ProfileRepo,
} from "../../";

import { run } from "./iprofile-repo.th";

describe("ProfileRepo", () => {
  run(() => new ProfileRepo(), true);
});
