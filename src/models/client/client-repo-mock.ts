import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { IAuthTokenMaster } from "../../auth";
import { Client, IClientDB } from "./client";
import { IClientRepo } from "./iclient-repo";

export class ClientRepoMock implements IClientRepo {
  private clients: IClientDB[] = [];

  async findOne(id: string): Promise<Client> {
    const client = this.clients.find(c => c._id.toHexString() === id);

    if (client === undefined) {
      throw new AtNotFoundError("クライアントが存在しません");
    }
    return Client.fromDB(client);
  }

  async findIn(ids: string[]): Promise<Client[]> {
    const clients = this.clients
      .filter(c => ids.findIndex(id => c._id.toHexString() === id))
      .sort((a, b) => a.date.valueOf() - b.date.valueOf());

    if (clients.length !== ids.length) {
      throw new AtNotFoundPartError("クライアントが存在しません",
        clients.map(x => x._id.toString()));
    }

    return clients.map(c => Client.fromDB(c));
  }

  async findAll(authToken: IAuthTokenMaster): Promise<Client[]> {
    const clients = this.clients
      .filter(c => c.user.toHexString() === authToken.user)
      .sort((a, b) => a.date.valueOf() - b.date.valueOf());

    return clients.map(c => Client.fromDB(c));
  }

  async insert(client: Client): Promise<null> {
    this.clients.push(client.toDB());

    return null;
  }

  async update(client: Client): Promise<null> {
    this.clients[this.clients.findIndex(c => c._id.toHexString() === client.id)] = client.toDB();
    return null;
  }
}
