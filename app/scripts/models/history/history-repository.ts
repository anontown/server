import { History, IHistoryDB } from './history';
import { AtNotFoundError, AtNotFoundPartError } from '../../at-error';
import { Topic } from '../topic';
import { ESClient } from "../../db";
import { Config } from "../../config";

export class HistoryRepository {
  static async insert(history: History): Promise<null> {
    let hDB = history.toDB();
    await ESClient.create({
      index: "histories",
      type: "normal",
      id: hDB.id,
      body: hDB.body
    });
    return null;
  }

  static async update(history: History): Promise<null> {
    let hDB = history.toDB();
    await ESClient.update({
      index: "histories",
      type: "normal",
      id: hDB.id,
      body: hDB.body
    });
    return null;
  }

  static async findOne(id: string): Promise<History> {
    let histories = await ESClient.search<IHistoryDB["body"]>({
      index: 'histories',
      size: 1,
      body: {
        query: {
          term: {
            _id: id
          }
        }
      }
    });

    if (histories.hits.total === 0) {
      throw new AtNotFoundError("編集履歴が存在しません");
    }

    return History.fromDB(histories.hits.hits.map(h => ({ id: h._id, body: h._source }))[0]);
  }

  static async findIn(ids: string[]): Promise<History[]> {
    let histories = await ESClient.search<IHistoryDB["body"]>({
      index: 'histories',
      size: ids.length,
      body: {
        query: {
          terms: {
            _id: ids
          }
        },
        sort: { ageUpdate: { order: "desc" } }
      },
    });

    if (histories.hits.total !== ids.length) {
      throw new AtNotFoundPartError("編集履歴が存在しません",
        histories.hits.hits.map(t => t._id));
    }

    return histories.hits.hits.map(h => History.fromDB({ id: h._id, body: h._source }));
  }

  static async findAll(topic: Topic): Promise<History[]> {
    let histories = await ESClient.search<IHistoryDB["body"]>({
      index: 'histories',
      size: Config.api.limit,
      body: {
        query: {
          terms: {
            topic: topic.id
          }
        },
        sort: { ageUpdate: { order: "desc" } }
      },
    });

    return histories.hits.hits.map(h => History.fromDB({ id: h._id, body: h._source }));
  }
}