import { AtAuthError, AtNotFoundError } from "../../at-error";
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

  async insert(client: Client): Promise<void> {
    this.clients.push(client.toDB());
  }

  async update(client: Client): Promise<void> {
    this.clients[this.clients.findIndex(c => c._id.toHexString() === client.id)] = client.toDB();
  }

  async find(authToken: IAuthTokenMaster | null, query: {
    id?: string[],
    self?: boolean,
  }): Promise<Client[]> {
    if (query.self && authToken === null) {
      throw new AtAuthError("認証が必要です");
    }

    const clients = this.clients
      .filter(c => !query.self || authToken === null || c.user.toHexString() === authToken.user)
      .filter(x => query.id === undefined || query.id.includes(x._id.toHexString()))
      .sort((a, b) => b.date.valueOf() - a.date.valueOf());

    return clients.map(c => Client.fromDB(c));
  }
}
