import { inferSchema } from "neo4j-graphql-js";
import neo4j from "neo4j-driver";
import { config } from "../src/config";

// create the neo4j driver
const driver = neo4j.driver(config.neo4j.url, neo4j.auth.basic(config.neo4j.login, config.neo4j.password));

inferSchema(driver)
  .then((result) => {
    console.log(result.typeDefs);
    process.exit();
  })
  .catch((e) => {
    console.log("error", e);
    process.exit();
  });
