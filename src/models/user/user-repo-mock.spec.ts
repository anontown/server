import {
  UserRepoMock,
} from "../../";
import { run } from "./iuser-repo.th";
describe("UserRepoMock", () => {
  run(() => new UserRepoMock(), false);
});
