import * as G from "../generated/graphql";
import { observableAsyncIterator } from "../utils";
import * as op from "rxjs/operators";


export const subscription: G.SubscriptionResolvers = {
  resAdded: {
    subscribe: (_parent, args, context, _info) =>
      observableAsyncIterator(context.repo.res.insertEvent
        .pipe(
          op.filter(x => x.res.topic === args.topic),
          op.map(x => ({ count: x.count, res: x.res.toAPI(context.auth.tokenOrNull) }))
        )),
  },
};