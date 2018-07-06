import { Subject } from "rxjs";
import { AtAuthError, AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { IResFindQuery, IResRepo } from "./ires-repo";
import { fromDBToRes, IResDB, Res } from "./res";
import { DateType } from "../../server";
import { AuthContainer } from "../../server/auth-container";

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

  async find(
    query: IResFindQuery,
    authToken: IAuthToken | null,
    type: "gt" | "gte" | "lt" | "lte",
    date: Date,
    limit: number): Promise<Res[]> {
    let notice: string | null;
    if (query.notice) {
      if (authToken !== null) {
        notice = authToken.user;
      } else {
        throw new AtAuthError("認証が必要です");
      }
    } else {
      notice = null;
    }

    let self: string | null;
    if (query.self) {
      if (authToken !== null) {
        self = authToken.user;
      } else {
        throw new AtAuthError("認証が必要です");
      }
    } else {
      self = null;
    }
    const texts = query.text !== undefined
      ? query.text
        .split(/\s/)
        .filter(x => x.length !== 0)
      : null;

    const reses = this.reses
      .filter(x => query.topic === undefined || x.body.topic === query.topic)
      .filter(x => notice === null || x.body.type === "normal" && x.body.reply !== null && x.body.reply.user === notice)
      .filter(x => query.hash === undefined || x.body.hash === query.hash)
      .filter(x => query.reply === undefined ||
        x.body.type === "normal" && x.body.reply !== null && x.body.reply.res === query.reply)
      .filter(x => query.profile === undefined ||
        x.body.type === "normal" && x.body.profile !== null && x.body.profile === query.profile)
      .filter(x => self === null || x.body.user === self)
      .filter(x => texts === null || texts.every(t => x.body.type === "normal" && x.body.text.includes(t)))
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

    const result = await this.aggregate(reses);
    if (type === "gt" || type === "gte") {
      result.reverse();
    }
    return result;
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

  private async aggregate(reses: IResDB[]): Promise<Res[]> {
    const count = await this.replyCount(reses.map(x => x.id));
    return reses.map(r => fromDBToRes(r, count.get(r.id) || 0));
  }

  async find2(auth: AuthContainer, query: {
    id: string[] | null,
    topic: string | null,
    notice: boolean | null,
    hash: string | null,
    reply: string | null,
    profile: string | null,
    text: string | null,
    self: boolean | null,
    date: DateType | null,
  }, limit: number): Promise<Res[]> {
    const notice = query.notice !== null ? auth.token.user : null;
    const self = query.self !== null ? auth.token.user : null;
    const texts = query.text !== null
      ? query.text
        .split(/\s/)
        .filter(x => x.length !== 0)
      : null;

    const reses = this.reses
      .filter(x => query.topic === null || x.body.topic === query.topic)
      .filter(x => notice === null || x.body.type === "normal" && x.body.reply !== null && x.body.reply.user === notice)
      .filter(x => query.hash === null || x.body.hash === query.hash)
      .filter(x => query.reply === null ||
        x.body.type === "normal" && x.body.reply !== null && x.body.reply.res === query.reply)
      .filter(x => query.profile === null ||
        x.body.type === "normal" && x.body.profile !== null && x.body.profile === query.profile)
      .filter(x => self === null || x.body.user === self)
      .filter(x => texts === null || texts.every(t => x.body.type === "normal" && x.body.text.includes(t)))
      .filter(x => {
        if (query.date === null) {
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
        return query.date !== null && (query.date.type === "gt" || query.date.type === "gte") ? av - bv : bv - av;
      })
      .slice(0, limit);

    const result = await this.aggregate(reses);
    if (query.date !== null && (query.date.type === "gt" || query.date.type === "gte")) {
      result.reverse();
    }
    return result;
  }
}
