import { run } from "./itopic-repo.th";

import {
  ResRepoMock,
  TopicRepo,
} from "../../";

describe("TopicRepo", () => {
  run(() => new TopicRepo(new ResRepoMock(), true), true);
});
