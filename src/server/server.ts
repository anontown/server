import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { buildSchema } from "graphql";
import * as fs from "fs";
import { Config } from "../config";

const app = express();

app.use(bodyParser.json());
app.use("/graphql", graphqlExpress({
  schema: buildSchema(fs.readFileSync("app.graphql", "utf8"))
}));
app.get("/graphiql", graphiqlExpress({ endpointURL: "/graphql" }));

app.listen(Config.server.port);