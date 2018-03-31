import { ClientRepoMock } from "./client";
import { HistoryRepoMock } from "./history";
import { IRepo } from "./irepo";
import { MsgRepoMock } from "./msg";
import { ProfileRepoMock } from "./profile";
import { ResRepoMock } from "./res";
import { TokenRepoMock } from "./token";
import { TopicRepoMock } from "./topic";
import { UserRepoMock } from "./user";
import { StorageRepoMock } from "./storage";

export class RepoMock implements IRepo {
  readonly client: ClientRepoMock;
  readonly history: HistoryRepoMock;
  readonly msg: MsgRepoMock;
  readonly profile: ProfileRepoMock;
  readonly res: ResRepoMock;
  readonly token: TokenRepoMock;
  readonly topic: TopicRepoMock;
  readonly user: UserRepoMock;
  readonly storage: StorageRepoMock;

  constructor() {
    this.client = new ClientRepoMock();
    this.history = new HistoryRepoMock();
    this.msg = new MsgRepoMock();
    this.profile = new ProfileRepoMock();
    this.res = new ResRepoMock();
    this.topic = new TopicRepoMock(this.res);
    this.token = new TokenRepoMock(this.client);
    this.user = new UserRepoMock();
    this.storage = new StorageRepoMock();
  }
}
