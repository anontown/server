import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { IMsgRepo } from "./imsg-repo";
import { IMsgDB, Msg } from "./msg";

export class MsgRepoMock implements IMsgRepo {
  private msgs: IMsgDB[] = [];

  async findOne(id: string): Promise<Msg> {
    const msg = this.msgs.find(x => x.id === id);

    if (msg === undefined) {
      throw new AtNotFoundError("メッセージが存在しません");
    }

    return Msg.fromDB(msg);
  }

  async findIn(ids: string[]): Promise<Msg[]> {
    const msgs = this.msgs
      .filter(x => ids.includes(x.id))
      .sort((a, b) => new Date(b.body.date).valueOf() - new Date(a.body.date).valueOf());

    if (msgs.length !== ids.length) {
      throw new AtNotFoundPartError("メッセージが存在しません",
        msgs.map(x => x.id));
    }

    return msgs.map(x => Msg.fromDB(x));
  }

  async find(
    authToken: IAuthToken,
    type: "gt" | "gte" | "lt" | "lte",
    date: Date,
    limit: number): Promise<Msg[]> {
    const msgs = this.msgs
      .filter(x => x.body.receiver === null || x.body.receiver === authToken.user)
      .filter(x => {
        const dateV = date.valueOf();
        const xDateV = new Date(x.body.date).valueOf();
        switch (type) {
          case "gte":
            return dateV <= xDateV;
          case "gt":
            return dateV < xDateV;
          case "lte":
            return dateV >= xDateV;
          case "lt":
            return dateV > xDateV;
        }
      })
      .sort((a, b) => {
        const av = new Date(a.body.date).valueOf();
        const bv = new Date(b.body.date).valueOf();
        return type === "gt" || type === "gte" ? av - bv : bv - av;
      })
      .slice(0, limit);

    const result = msgs.map(x => Msg.fromDB(x));
    if (type === "gt" || type === "gte") {
      result.reverse();
    }
    return result;
  }

  async insert(msg: Msg): Promise<void> {
    this.msgs.push(msg.toDB());
  }

  async update(msg: Msg): Promise<void> {
    this.msgs[this.msgs.findIndex(x => x.id === msg.id)] = msg.toDB();
  }
}
