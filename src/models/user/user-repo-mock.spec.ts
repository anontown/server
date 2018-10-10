import { run } from "./iuser-repo.th";
import {
  UserRepoMock,
} from "../../";
describe("UserRepoMock", () => {
  run(() => new UserRepoMock(), false);
});
