import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { Config } from "../../config";
import { ESClient } from "../../db";
import { History, IHistoryDB } from "./history";
import { IHistoryRepo } from "./ihistory-repo";
import { Refresh } from "elasticsearch";

export class HistoryRepo implements IHistoryRepo {
  constructor(private refresh?: Refresh) { }

  async insert(history: History): Promise<void> {
    const hDB = history.toDB();
    await ESClient.create({
      index: "histories",
      type: "doc",
      id: hDB.id,
      body: hDB.body,
      refresh: this.refresh,
    });
  }

  async update(history: History): Promise<void> {
    const hDB = history.toDB();
    await ESClient.update({
      index: "histories",
      type: "doc",
      id: hDB.id,
      body: hDB.body,
      refresh: this.refresh,
    });
  }

  async findOne(id: string): Promise<History> {
    try {
      const history = await ESClient.get<IHistoryDB["body"]>({
        index: "histories",
        type: "doc",
        id
      });

      return History.fromDB(({ id: history._id, body: history._source }));
    } catch{
      throw new AtNotFoundError("編集履歴が存在しません");
    }
  }

  async findIn(ids: string[]): Promise<History[]> {
    const histories = await ESClient.search<IHistoryDB["body"]>({
      index: "histories",
      type: "doc",
      size: ids.length,
      body: {
        query: {
          terms: {
            _id: ids
          }
        },
        sort: { date: { order: "desc" } },
      },
    });

    if (histories.hits.total !== ids.length) {
      throw new AtNotFoundPartError("編集履歴が存在しません",
        histories.hits.hits.map(t => t._id));
    }

    return histories.hits.hits.map(h => History.fromDB({ id: h._id, body: h._source }));
  }

  async findAll(topicID: string): Promise<History[]> {
    const histories = await ESClient.search<IHistoryDB["body"]>({
      index: "histories",
      size: Config.api.limit,
      body: {
        query: {
          term: {
            topic: topicID,
          },
        },
        sort: { date: { order: "desc" } },
      },
    });

    return histories.hits.hits.map(h => History.fromDB({ id: h._id, body: h._source }));
  }
}
