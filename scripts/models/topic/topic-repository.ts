import { ESClient } from '../../db';
import { AtNotFoundError, AtNotFoundPartError } from '../../at-error'
import { Topic, ITopicDB, TopicNormal, TopicOne, TopicFork, ITopicOneDB, ITopicNormalDB, ITopicForkDB } from './topic';
import { CronJob } from 'cron';
import { SearchResponse } from "elasticsearch";

export class TopicRepository {
  static async findOne(id: string): Promise<Topic> {
    let topics = await ESClient.search<ITopicDB["body"]>({
      index: 'topics',
      size: 1,
      body: {
        query: {
          term: {
            _id: id
          }
        }
      }
    });

    if (topics.hits.total === 0) {
      throw new AtNotFoundError("トピックが存在しません");
    }

    return (await this.aggregate(topics))[0];
  }

  static async findIn(ids: string[]): Promise<Topic[]> {
    let topics = await ESClient.search<ITopicDB["body"]>({
      index: 'topics',
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

    if (topics.hits.total !== ids.length) {
      throw new AtNotFoundPartError("トピックが存在しません",
        topics.hits.hits.map(t => t._id));
    }

    return this.aggregate(topics);
  }

  static async findTags(limit: number): Promise<{ name: string, count: number }[]> {
    let data = await ESClient.search({
      index: "topics",
      size: 0,
      body: {
        aggs: {
          tags_count: {
            terms: {
              field: "tags",
              size: limit
            }
          }
        }
      }
    })

    let tags: { key: string, doc_count: number }[] = data.aggregations.tags_count.buckets;

    return tags.map(x => ({ name: x.key, count: x.doc_count }));
  }

  static async find(titles: string[], tags: string[], skip: number, limit: number, activeOnly: boolean): Promise<Topic[]> {
    let topics = await ESClient.search<ITopicOneDB["body"] | ITopicNormalDB["body"]>({
      index: "topics",
      type: ["normal", "one"],
      size: limit,
      from: skip,
      body: {
        query: {
          bool: {
            filter: [
              ...titles.map(t => ({ match: { title: t } })),
              ...tags.map(t => ({ match: { tags: t } })),
              ...activeOnly ? [{ match: { active: true } }] : []
            ]
          }
        },
        sort: { ageUpdate: { order: "desc" } }
      }
    })

    return this.aggregate(topics);
  }

  static async findFork(parent: TopicNormal, skip: number, limit: number, activeOnly: boolean): Promise<Topic[]> {
    let topics = await ESClient.search<ITopicForkDB["body"]>({
      index: "topics",
      type: "fork",
      size: limit,
      from: skip,
      body: {
        query: {
          bool: {
            filter: [
              { match: { parent: parent.id } },
              ...activeOnly ? [{ match: { active: true } }] : []
            ]
          }
        },
        sort: { ageUpdate: { order: "desc" } }
      }
    })

    return this.aggregate(topics);
  }

  private static async aggregate(topics: SearchResponse<ITopicDB["body"]>): Promise<Topic[]> {
    let data = await ESClient.search({
      index: "reses",
      size: 0,
      body: {
        query: {
          terms: {
            topic: topics.hits.hits.map(t => t._id)
          }
        },
        aggs: {
          res_count: {
            terms: {
              field: "topic"
            }
          }
        }
      }
    });

    let countArr: { key: string, doc_count: number }[] = data.aggregations.res_count.buckets;
    let count = new Map(countArr.map<[string, number]>(x => [x.key, x.doc_count]));

    return topics.hits.hits.map(t => {
      let c = count.get(t._id) || 0;
      let dbObj = { id: t._id, type: t._type, body: t._source } as ITopicDB;
      switch (dbObj.type) {
        case 'normal':
          return TopicNormal.fromDB(dbObj, c);
        case 'one':
          return TopicOne.fromDB(dbObj, c);
        case 'fork':
          return TopicFork.fromDB(dbObj, c);
      }
    });

  }

  static cron() {
    //毎時間トピ落ちチェック
    new CronJob({
      cronTime: '00 00 * * * *',
      onTick: async () => {
        await ESClient.updateByQuery({
          index: "topics",
          type: ["one", "fork"],
          body: {
            script: {
              inline: "ctx._source.active = false"
            },
            query: {
              range: {
                update: {
                  lt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
                }
              }
            }
          }
        })
      },
      start: false,
      timeZone: 'Asia/Tokyo'
    }).start();
  }

  static async insert(topic: Topic): Promise<null> {
    let tDB = topic.toDB();
    await ESClient.create({
      index: "topics",
      type: tDB.type,
      id: tDB.id,
      body: tDB.body
    });
    return null;
  }

  static async update(topic: Topic): Promise<null> {
    let tDB = topic.toDB();
    await ESClient.update({
      index: "topics",
      type: tDB.type,
      id: tDB.id,
      body: tDB.body
    });
    return null;
  }
}