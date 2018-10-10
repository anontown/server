import { run } from "./iuser-repo.th";
import {
  UserRepo,
} from "../../";
describe("UserRepo", () => {
  run(() => new UserRepo(), true);
});
