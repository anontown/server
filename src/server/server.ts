import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { buildSchema } from "graphql";
import * as fs from "fs";
import { Config } from "../config";
import * as http from "http";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const server = http.createServer(app as any);

app.use("/graphql", graphqlExpress({
  schema: buildSchema(fs.readFileSync("app.graphql", "utf8"))
}));
app.get("/graphiql", graphiqlExpress({ endpointURL: "/graphql" }));

server.listen(Config.server.port);
