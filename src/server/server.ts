import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { execute, subscribe } from "graphql";
import * as fs from "fs";
import { Config } from "../config";
import * as http from "http";
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { makeExecutableSchema } from "graphql-tools";

const schema = makeExecutableSchema({
  typeDefs: fs.readFileSync("app.gql", "utf8"),
  resolvers: {}
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const server = http.createServer(app as any);

new SubscriptionServer({ schema, execute, subscribe }, { server, path: "subscriptions" });

app.use("/graphql", graphqlExpress({
  schema,
}));
app.get("/graphiql", graphiqlExpress({ endpointURL: "/graphql" }));

server.listen(Config.server.port);
