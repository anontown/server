import {
  UserRepo,
} from "../../";
import { run } from "./iuser-repo.th";
describe("UserRepo", () => {
  run(() => new UserRepo(), true);
});
