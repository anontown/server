import {
  IRepo,
} from "../models";
import {
  Context,
} from "../server";

export const historyResolver = (repo: IRepo) => {
  return {
    Query: {
      histories: async (_obj: any,
                        args: {
          id: string[] | null,
          topic: string[] | null,
        },              _context: Context,
                        _info: any) => {
        const histories = await repo.history.find({
          id: args.id,
          topic: args.topic,
        });
        return histories.map(x => x.toAPI());
      },
    },
  };
};
