import { AtNotFoundError } from "../../at-error";
import { History, IHistoryDB } from "./history";
import { HistoryQuery, IHistoryRepo } from "./ihistory-repo";

export class HistoryRepoMock implements IHistoryRepo {
  private histories: IHistoryDB[] = [];

  async insert(history: History): Promise<void> {
    this.histories.push(history.toDB());
  }

  async update(history: History): Promise<void> {
    this.histories[this.histories.findIndex(h => h.id === history.id)] = history.toDB();
  }

  async findOne(id: string): Promise<History> {
    const history = this.histories.find(h => h.id === id);

    if (history === undefined) {
      throw new AtNotFoundError("編集履歴が存在しません");
    }

    return History.fromDB(history);
  }

  async find(query: HistoryQuery, limit: number): Promise<History[]> {
    const histories = this.histories
      .filter(x => query.id === undefined || query.id.includes(x.id))
      .filter(x => query.topic === undefined || query.topic.includes(x.body.topic))
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

    const result = histories.map(h => History.fromDB(h));
    if (query.date !== undefined && (query.date.type === "gt" || query.date.type === "gte")) {
      result.reverse();
    }
    return result;
  }
}
