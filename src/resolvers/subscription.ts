import * as op from "rxjs/operators";
import * as G from "../generated/graphql";
import { observableAsyncIterator } from "../utils";

export const subscription: G.SubscriptionResolvers = {
  resAdded: {
    subscribe: (_parent, args, context, _info) =>
      observableAsyncIterator(context.repo.res.insertEvent
        .pipe(
          op.filter(x => x.res.topic === args.topic),
          op.map(x => ({ count: x.count, res: x.res.toAPI(context.auth.tokenOrNull) })),
        )),
    resolve: (x, _b, _c, _d) => {
      // TODO: こうしないと動かない何故
      return x as any;
    },
  },
};
