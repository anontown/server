import { IRepo } from "./irepo";
import DataLoader from "dataloader";
import { AuthContainer } from "../server/auth-container";

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

export function createLoader(repo: IRepo, auth: AuthContainer) {
    return {
        client: loader(ids => repo.client.find(auth.TokenMasterOrNull, { id: ids })),
        history: loader(ids => repo.history.find({ id: ids })),
        msg: loader(ids => repo.msg.find(auth.token, { id: ids }, ids.length)),
        profile: loader(ids => repo.profile.find(auth, { id: ids })),
        res: loader(ids => repo.res.find(auth, { id: ids }, ids.length)),
        topic: loader(ids => repo.topic.find({ id: ids }, 0, ids.length)),
    };
}
