import * as G from "../generated/graphql";

export const token: G.TokenResolvers = {
  __resolveType(obj) {
    switch (obj.type) {
      case "general":
        return "TokenGeneral";
      case "master":
        return "TokenMaster";
    }
  },
};

export const tokenGeneral: G.TokenGeneralResolvers = {
  client: async (
    token,
    _args,
    context,
    _info) => {
    const client = await context.loader.client.load(token.clientID);
    return client.toAPI(context.auth.TokenMasterOrNull);
  },
};
