import { AtNotFoundError } from "../../at-error";
import { ESClient } from "../../db";
import { History, IHistoryDB } from "./history";
import { IHistoryRepo } from "./ihistory-repo";
import * as G from "../../generated/graphql";
import { isNullish } from "@kgtkr/utils";
export class HistoryRepo implements IHistoryRepo {
  constructor(private refresh?: boolean) { }

  async insert(history: History): Promise<void> {
    const hDB = history.toDB();
    await ESClient().create({
      index: "histories",
      type: "doc",
      id: hDB.id,
      body: hDB.body,
      refresh: this.refresh,
    });
  }

  async update(history: History): Promise<void> {
    const hDB = history.toDB();
    await ESClient().index({
      index: "histories",
      type: "doc",
      id: hDB.id,
      body: hDB.body,
      refresh: this.refresh !== undefined ? this.refresh.toString() as | "true" | "false" : undefined,
    });
  }

  async findOne(id: string): Promise<History> {
    let history;
    try {
      history = await ESClient().get<IHistoryDB["body"]>({
        index: "histories",
        type: "doc",
        id,
      });
    } catch {
      throw new AtNotFoundError("編集履歴が存在しません");
    }

    return History.fromDB(({ id: history._id, body: history._source }));
  }

  async find(query: G.HistoryQuery, limit: number): Promise<History[]> {
    const filter: any[] = [];
    if (!isNullish(query.id)) {
      filter.push({
        terms: {
          _id: query.id,
        },
      });
    }

    if (!isNullish(query.date)) {
      filter.push({
        range: {
          date: {
            [query.date.type]: query.date.date,
          },
        },
      });
    }

    if (!isNullish(query.topic)) {
      filter.push({
        terms: {
          topic: query.topic,
        },
      });
    }

    const histories = await ESClient().search<IHistoryDB["body"]>({
      index: "histories",
      size: limit,
      body: {
        query: {
          bool: {
            filter,
          },
        },
        sort: {
          date: {
            order: !isNullish(query.date) && (query.date.type === "gt" || query.date.type === "gte")
              ? "asc"
              : "desc",
          },
        },
      },
    });

    const result = histories.hits.hits.map(h => History.fromDB({ id: h._id, body: h._source }));
    if (!isNullish(query.date) && (query.date.type === "gt" || query.date.type === "gte")) {
      result.reverse();
    }
    return result;
  }
}
