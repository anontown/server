import { run } from "./itopic-repo.th";

import {
  ResRepoMock,
  TopicRepoMock,
} from "../../";

describe("TopicRepoMock", () => {
  run(() => new TopicRepoMock(new ResRepoMock()), false);
});
