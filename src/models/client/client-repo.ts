import { ObjectID } from "mongodb";
import { AtAuthError, AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { IAuthTokenMaster } from "../../auth";
import { DB } from "../../db";
import { Client, IClientDB } from "./client";
import { IClientRepo } from "./iclient-repo";

export class ClientRepo implements IClientRepo {
  async findOne(id: string): Promise<Client> {
    const db = await DB;
    const client: IClientDB | null = await db.collection("clients")
      .findOne({ _id: new ObjectID(id) });

    if (client === null) {
      throw new AtNotFoundError("クライアントが存在しません");
    }
    return Client.fromDB(client);
  }

  async findIn(ids: string[]): Promise<Client[]> {
    const db = await DB;
    const clients: IClientDB[] = await db.collection("clients")
      .find({ _id: { $in: ids.map(id => new ObjectID(id)) } })
      .sort({ date: -1 })
      .toArray();

    if (clients.length !== ids.length) {
      throw new AtNotFoundPartError("クライアントが存在しません",
        clients.map(x => x._id.toString()));
    }

    return clients.map(c => Client.fromDB(c));
  }

  async findAll(authToken: IAuthTokenMaster): Promise<Client[]> {
    const db = await DB;
    const clients: IClientDB[] = await db.collection("clients")
      .find({ user: new ObjectID(authToken.user) })
      .sort({ date: -1 })
      .toArray();
    return clients.map(c => Client.fromDB(c));
  }

  async find(authToken: IAuthTokenMaster | null, query: {
    id?: string[],
    self?: boolean,
  }): Promise<Client[]> {
    if (query.self && authToken === null) {
      throw new AtAuthError("認証が必要です");
    }
    const db = await DB;
    const q: any = {};
    if (query.self && authToken !== null) {
      q.user = new ObjectID(authToken.user);
    }
    if (query.id !== undefined) {
      q._id = { $in: query.id.map(id => new ObjectID(id)) };
    }
    const clients: IClientDB[] = await db.collection("clients")
      .find(q)
      .sort({ date: -1 })
      .toArray();
    return clients.map(c => Client.fromDB(c));
  }

  async insert(client: Client): Promise<void> {
    const db = await DB;

    await db.collection("clients")
      .insert(client.toDB());
  }

  async update(client: Client): Promise<void> {
    const db = await DB;
    await db.collection("clients").update({ _id: new ObjectID(client.id) }, client.toDB());
  }
}
