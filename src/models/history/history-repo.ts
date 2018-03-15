import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { Config } from "../../config";
import { ESClient } from "../../db";
import { Topic } from "../topic";
import { History, IHistoryDB } from "./history";
import { IHistoryRepo } from "./ihistory-repo";

export class HistoryRepo implements IHistoryRepo {
  async insert(history: History): Promise<void> {
    const hDB = history.toDB();
    await ESClient.create({
      index: "histories",
      type: "normal",
      id: hDB.id,
      body: hDB.body,
    });
  }

  async update(history: History): Promise<void> {
    const hDB = history.toDB();
    await ESClient.update({
      index: "histories",
      type: "normal",
      id: hDB.id,
      body: hDB.body,
    });
  }

  async findOne(id: string): Promise<History> {
    try {
      const history = await ESClient.get<IHistoryDB["body"]>({
        index: "histories",
        type: "normal",
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
      size: ids.length,
      body: {
        query: {
          terms: {
            _id: ids,
          },
        },
        sort: { ageUpdate: { order: "desc" } },
      },
    });

    if (histories.hits.total !== ids.length) {
      throw new AtNotFoundPartError("編集履歴が存在しません",
        histories.hits.hits.map(t => t._id));
    }

    return histories.hits.hits.map(h => History.fromDB({ id: h._id, body: h._source }));
  }

  async findAll(topic: Topic): Promise<History[]> {
    const histories = await ESClient.search<IHistoryDB["body"]>({
      index: "histories",
      size: Config.api.limit,
      body: {
        query: {
          terms: {
            topic: topic.id,
          },
        },
        sort: { ageUpdate: { order: "desc" } },
      },
    });

    return histories.hits.hits.map(h => History.fromDB({ id: h._id, body: h._source }));
  }
}
