import { Subject } from "rxjs";
import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { Config } from "../../config";
import { IResRepo } from "./ires-repo";
import { fromDBToRes, IResDB, Res } from "./res";

export class ResRepoMock implements IResRepo {
  readonly insertEvent: Subject<{ res: Res, count: number }> = new Subject<{ res: Res, count: number }>();
  private reses: IResDB[] = [];

  async findOne(id: string): Promise<Res> {
    const res = this.reses.find(x => x.id === id);

    if (res === undefined) {
      throw new AtNotFoundError("レスが存在しません");
    }

    return (await this.aggregate([res]))[0];
  }

  async findIn(ids: string[]): Promise<Res[]> {
    const reses = this.reses
      .filter(x => ids.includes(x.id))
      .sort((a, b) => new Date(b.body.date).valueOf() - new Date(a.body.date).valueOf());

    if (reses.length !== ids.length) {
      throw new AtNotFoundPartError("レスが存在しません",
        reses.map(r => r.id));
    }

    return this.aggregate(reses);
  }

  async find(topicID: string, type: "before" | "after", equal: boolean, date: Date, limit: number): Promise<Res[]> {
    const reses = this.reses
      .filter(x => x.body.topic === topicID)
      .filter(x => {
        const dateV = date.valueOf();
        const xDateV = new Date(x.body.date).valueOf();
        return type === "after"
          ? (equal ? dateV <= xDateV : dateV < xDateV)
          : (equal ? xDateV <= dateV : xDateV < dateV);
      })
      .sort((a, b) => {
        const av = new Date(a.body.date).valueOf();
        const bv = new Date(b.body.date).valueOf();
        return type === "after" ? av - bv : bv - av;
      })
      .slice(0, limit);

    const result = await this.aggregate(reses);
    if (type === "after") {
      result.reverse();
    }
    return result;
  }

  async findNew(topicID: string, limit: number): Promise<Res[]> {
    const reses = this.reses
      .filter(x => x.body.topic === topicID)
      .sort((a, b) => new Date(b.body.date).valueOf() - new Date(a.body.date).valueOf())
      .slice(0, limit);

    return await this.aggregate(reses);
  }

  async findNotice(
    authToken: IAuthToken,
    type: "before" | "after",
    equal: boolean,
    date: Date,
    limit: number): Promise<Res[]> {
    const reses = this.reses
      .filter(x => x.body.type === "normal" && x.body.reply !== null && x.body.reply.user === authToken.user)
      .filter(x => {
        const dateV = date.valueOf();
        const xDateV = new Date(x.body.date).valueOf();
        return type === "after"
          ? (equal ? dateV <= xDateV : dateV < xDateV)
          : (equal ? xDateV <= dateV : xDateV < dateV);
      })
      .sort((a, b) => {
        const av = new Date(a.body.date).valueOf();
        const bv = new Date(b.body.date).valueOf();
        return type === "after" ? av - bv : bv - av;
      })
      .slice(0, limit);

    const result = await this.aggregate(reses);
    if (type === "after") {
      result.reverse();
    }
    return result;
  }

  async findNoticeNew(authToken: IAuthToken, limit: number): Promise<Res[]> {
    const reses = this.reses
      .filter(x => x.body.type === "normal" && x.body.reply !== null && x.body.reply.user === authToken.user)
      .sort((a, b) => new Date(b.body.date).valueOf() - new Date(a.body.date).valueOf())
      .slice(0, limit);

    return await this.aggregate(reses);
  }

  async findHash(hash: string): Promise<Res[]> {
    const reses = this.reses
      .filter(x => x.body.hash === hash)
      .sort((a, b) => new Date(b.body.date).valueOf() - new Date(a.body.date).valueOf())
      .slice(0, Config.api.limit);

    return await this.aggregate(reses);
  }

  async findReply(resID: string): Promise<Res[]> {
    const reses = this.reses
      .filter(x => x.body.type === "normal" && x.body.reply !== null && x.body.reply.res === resID)
      .sort((a, b) => new Date(b.body.date).valueOf() - new Date(a.body.date).valueOf())
      .slice(0, Config.api.limit);

    return await this.aggregate(reses);
  }

  async insert(res: Res): Promise<void> {
    this.reses.push(res.toDB());

    const resCount = (await this.resCount([res.topic])).get(res.topic) || 0;
    this.insertEvent.next({ res, count: resCount });
  }

  async update(res: Res): Promise<void> {
    this.reses[this.reses.findIndex(x => x.id === res.id)] = res.toDB();
  }

  async resCount(topicIDs: string[]): Promise<Map<string, number>> {
    return this.reses
      .filter(x => topicIDs.includes(x.body.topic))
      .map(x => x.body.topic)
      .reduce((c, x) => c.set(x, (c.get(x) || 0) + 1), new Map<string, number>());
  }

  async replyCount(resIDs: string[]): Promise<Map<string, number>> {
    return this.reses.map(x => x.body.type === "normal" && x.body.reply !== null ? x.body.reply.res : null)
      .filter<string>((x): x is string => x !== null && resIDs.includes(x))
      .reduce((c, x) => c.set(x, (c.get(x) || 0) + 1), new Map<string, number>())
  }

  private async aggregate(reses: IResDB[]): Promise<Res[]> {
    const count = await this.replyCount(reses.map(x => x.id));
    return reses.map(r => fromDBToRes(r, count.get(r.id) || 0));
  }
}
