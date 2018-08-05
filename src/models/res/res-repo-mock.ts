import { Subject } from "rxjs";
import { AtNotFoundError } from "../../at-error";
import { AuthContainer } from "../../server/auth-container";
import { IResRepo, ResQuery } from "./ires-repo";
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
      .reduce((c, x) => c.set(x, (c.get(x) || 0) + 1), new Map<string, number>());
  }

  async find(
    auth: AuthContainer,
    query: ResQuery,
    limit: number): Promise<Res[]> {
    const notice = query.notice ? auth.token.user : null;
    const self = query.self ? auth.token.user : null;
    const texts = query.text !== undefined
      ? query.text
        .split(/\s/)
        .filter(x => x.length !== 0)
      : null;

    const reses = this.reses
      .filter(x => query.id === undefined || query.id.includes(x.id))
      .filter(x => query.topic === undefined || x.body.topic === query.topic)
      .filter(x => notice === null ||
        x.body.type === "normal" && x.body.reply !== null && x.body.reply.user === notice)
      .filter(x => query.hash === undefined || x.body.hash === query.hash)
      .filter(x => query.reply === undefined ||
        x.body.type === "normal" && x.body.reply !== null && x.body.reply.res === query.reply)
      .filter(x => query.profile === undefined ||
        x.body.type === "normal" && x.body.profile !== null && x.body.profile === query.profile)
      .filter(x => self === null || x.body.user === self)
      .filter(x => texts === null || texts.every(t => x.body.type === "normal" && x.body.text.includes(t)))
      .filter(x => {
        if (query.date === undefined) {
          return true;
        }
        const dateV = new Date(query.date.date).valueOf();
        const xDateV = new Date(x.body.date).valueOf();
        switch (query.date.type) {
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
        return query.date !== undefined && (query.date.type === "gt" || query.date.type === "gte") ? av - bv : bv - av;
      })
      .slice(0, limit);

    const result = await this.aggregate(reses);
    if (query.date !== undefined && (query.date.type === "gt" || query.date.type === "gte")) {
      result.reverse();
    }
    return result;
  }

  private async aggregate(reses: IResDB[]): Promise<Res[]> {
    const count = await this.replyCount(reses.map(x => x.id));
    return reses.map(r => fromDBToRes(r, count.get(r.id) || 0));
  }
}
