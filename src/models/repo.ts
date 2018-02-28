import { ClientRepo } from "./client";
import { HistoryRepo } from "./history";
import { IRepo } from "./irepo";
import { MsgRepo } from "./msg";
import { ProfileRepo } from "./profile";
import { ResRepo } from "./res";
import { TokenRepo } from "./token";
import { TopicRepo } from "./topic";
import { UserRepo } from "./user";

export class Repo implements IRepo {
  readonly client: ClientRepo;
  readonly history: HistoryRepo;
  readonly msg: MsgRepo;
  readonly profile: ProfileRepo;
  readonly res: ResRepo;
  readonly token: TokenRepo;
  readonly topic: TopicRepo;
  readonly user: UserRepo;

  constructor() {
    this.client = new ClientRepo();
    this.history = new HistoryRepo();
    this.msg = new MsgRepo();
    this.profile = new ProfileRepo();
    this.topic = new TopicRepo();
    this.res = new ResRepo(this.topic);
    this.token = new TokenRepo(this.client);
    this.user = new UserRepo();
  }
}
