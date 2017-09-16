import { DB } from '../../db';
import { ObjectID } from 'mongodb';
import { AtNotFoundError, AtNotFoundPartError } from '../../at-error'
import { IClientDB, Client } from './client';
import { IAuthTokenMaster } from '../../auth'

export class ClientRepository {
  static async findOne(id: string): Promise<Client> {
    let db = await DB;
    let client: IClientDB | null = await db.collection("clients")
      .findOne({ _id: new ObjectID(id) });

    if (client === null) {
      throw new AtNotFoundError("クライアントが存在しません");
    }
    return Client.fromDB(client);
  }

  static async findIn(ids: string[]): Promise<Client[]> {
    let db = await DB;
    let clients: IClientDB[] = await db.collection("clients")
      .find({ _id: { $in: ids.map(id => new ObjectID(id)) } })
      .sort({ date: -1 })
      .toArray();

    if (clients.length !== ids.length) {
      throw new AtNotFoundPartError("クライアントが存在しません",
        clients.map(x => x._id.toString()));
    }

    return clients.map(c => Client.fromDB(c));
  }

  static async findAll(authToken: IAuthTokenMaster): Promise<Client[]> {
    let db = await DB;
    let clients: IClientDB[] = await db.collection("clients")
      .find({ user: new ObjectID(authToken.user) })
      .sort({ date: -1 })
      .toArray();
    return clients.map(c => Client.fromDB(c));
  }

  static async insert(client: Client): Promise<null> {
    let db = await DB;

    await db.collection("clients")
      .insert(client.toDB());

    return null;
  }

  static async update(client: Client): Promise<null> {
    let db = await DB;
    await db.collection("clients").update({ _id: new ObjectID(client.id) }, client.toDB());
    return null;
  }
}