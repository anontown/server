import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { History, IHistoryDB } from "./history";
import { IHistoryRepo } from "./ihistory-repo";

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

  async findIn(ids: string[]): Promise<History[]> {
    const histories = this.histories
      .filter(x => ids.includes(x.id))
      .sort((a, b) => new Date(b.body.date).valueOf() - new Date(a.body.date).valueOf());

    if (histories.length !== ids.length) {
      throw new AtNotFoundPartError("編集履歴が存在しません",
        histories.map(x => x.id));
    }

    return histories.map(h => History.fromDB(h));
  }

  async findAll(topicID: string): Promise<History[]> {
    const histories = this.histories
      .filter(x => x.body.topic === topicID)
      .sort((a, b) => new Date(b.body.date).valueOf() - new Date(a.body.date).valueOf());

    return histories.map(h => History.fromDB(h));
  }

  async find(query: { id: string[] | null, topic: string[] | null }): Promise<History[]> {
    const histories = this.histories
      .filter(x => query.id === null || query.id.includes(x.id))
      .filter(x => query.topic === null || query.topic.includes(x.body.topic))
      .sort((a, b) => new Date(b.body.date).valueOf() - new Date(a.body.date).valueOf());

    return histories.map(h => History.fromDB(h));
  }
}
