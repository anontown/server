import * as DataLoader from "dataloader";
import { AuthContainer } from "../server/auth-container";
import { Client } from "./client";
import { History } from "./history";
import { IRepo } from "./irepo";
import { Msg } from "./msg";
import { Profile } from "./profile";
import { Res } from "./res";
import { Topic } from "./topic";

function sort<T extends { id: string }>(ids: string[], data: T[]): (T | Error)[] {
    const map = new Map(data.map<[string, T]>(x => [x.id, x]));
    return ids.map(x => map.get(x) || new Error());
}

function loader<T extends { id: string }>(f: (ids: string[]) => Promise<T[]>): DataLoader<string, T> {
    return new DataLoader<string, T>(async ids => {
        const data = await f(ids);
        return sort(ids, data);
    });
}

export interface Loader {
    client: DataLoader<string, Client>;
    history: DataLoader<string, History>;
    msg: DataLoader<string, Msg>;
    profile: DataLoader<string, Profile>;
    res: DataLoader<string, Res>;
    topic: DataLoader<string, Topic>;
}

export function createLoader(repo: IRepo, auth: AuthContainer): Loader {
    return {
        client: loader(ids => repo.client.find(auth.TokenMasterOrNull, { id: ids })),
        history: loader(ids => repo.history.find({ id: ids }, ids.length)),
        msg: loader(ids => repo.msg.find(auth.token, { id: ids }, ids.length)),
        profile: loader(ids => repo.profile.find(auth, { id: ids })),
        res: loader(ids => repo.res.find(auth, { id: ids }, ids.length)),
        topic: loader(ids => repo.topic.find({ id: ids }, 0, ids.length)),
    };
}
