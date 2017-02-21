import { DB } from '../../db';
import { ObjectID } from 'mongodb';
import { AtError, StatusCode } from '../../at-error'
import { IClientDB,Client } from './client';
import { IAuthUser } from '../../auth'

export class ClientRepository {
    static async findOne(id: ObjectID): Promise<Client> {
    let db = await DB;
    let client: IClientDB | null = await db.collection("clients")
      .findOne({ _id: id });

    if (client === null) {
      throw new AtError(StatusCode.NotFound, "クライアントが存在しません");
    }
    return Client.fromDB(client);
  }

  static async findIn(ids: ObjectID[]): Promise<Client[]> {
    let db = await DB;
    let clients: IClientDB[] = await db.collection("clients")
      .find({ _id: { $in: ids } })
      .sort({ date: -1 })
      .toArray();

    if (clients.length !== ids.length) {
      throw new AtError(StatusCode.NotFound, "クライアントが存在しません");
    }

    return clients.map(c => Client.fromDB(c));
  }

  static async findAll(authUser: IAuthUser): Promise<Client[]> {
    let db = await DB;
    let clients: IClientDB[] = await db.collection("clients")
      .find({ user: authUser.id })
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
    await db.collection("clients").update({ _id: client.id }, client.toDB());
    return null;
  }
}