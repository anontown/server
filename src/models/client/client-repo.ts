import { ObjectID } from "mongodb";
import { AtAuthError, AtNotFoundError } from "../../at-error";
import { IAuthTokenMaster } from "../../auth";
import { DB } from "../../db";
import { Client, IClientDB } from "./client";
import { ClientQuery, IClientRepo } from "./iclient-repo";

export class ClientRepo implements IClientRepo {
  async findOne(id: string): Promise<Client> {
    const db = await DB();
    const client: IClientDB | null = await db.collection("clients")
      .findOne({ _id: new ObjectID(id) });

    if (client === null) {
      throw new AtNotFoundError("クライアントが存在しません");
    }
    return Client.fromDB(client);
  }

  async find(authToken: IAuthTokenMaster | null, query: ClientQuery): Promise<Client[]> {
    if (query.self && authToken === null) {
      throw new AtAuthError("認証が必要です");
    }
    const db = await DB();
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
    const db = await DB();

    await db.collection("clients")
      .insert(client.toDB());
  }

  async update(client: Client): Promise<void> {
    const db = await DB();
    await db.collection("clients").update({ _id: new ObjectID(client.id) }, client.toDB());
  }
}
