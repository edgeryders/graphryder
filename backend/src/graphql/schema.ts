import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";
import { GraphQLResolveInfo, GraphQLObjectType } from "graphql";
import gql from "graphql-tag";
import { ResolverContext } from "./index";
import { cypherToGraph } from "../utils";
import { getLogger } from "../logger";

// logger
const log = getLogger("GraphQl");

export const typeDefs = gql`
  #
  # Define custom Graphql types
  #
  scalar JSONObject

  #
  # Define GraphQl / Neo4j model
  #
  type group {
    _id: Long!
    discourse_id: Int!
    name: String!
    platform: String!
    has_access: [category] @relation(name: "HAS_ACCESS", direction: OUT)
    users: [user] @relation(name: "IN_GROUP", direction: IN)
  }

  type user {
    _id: Long!
    consent: String!
    consent_updated: String!
    discourse_id: Int!
    email: String!
    groups: String!
    platform: String!
    username: String!
    in_group: [group] @relation(name: "IN_GROUP", direction: OUT)
    is_global_user: [globaluser] @relation(name: "IS_GLOBAL_USER", direction: OUT)
    created: [topic] @relation(name: "CREATED", direction: OUT)
    talked_to: [user] @relation(name: "TALKED_TO", direction: OUT)
    TALKED_TO_rel: [TALKED_TO]
    quoted: [user] @relation(name: "QUOTED", direction: OUT)
    QUOTED_rel: [QUOTED]
    talked_or_quoted: [user] @relation(name: "TALKED_OR_QUOTED", direction: OUT)
    TALKED_OR_QUOTED_rel: [TALKED_OR_QUOTED]
    likes: [post] @relation(name: "LIKES", direction: OUT)
    used_code: [code] @relation(name: "USED_CODE", direction: OUT)
    USED_CODE_rel: [USED_CODE]
  }

  type globaluser {
    _id: Long!
    email: String!
    username: String!
    has_account_on: [platform] @relation(name: "HAS_ACCOUNT_ON", direction: OUT)
    users: [user] @relation(name: "IS_GLOBAL_USER", direction: IN)
  }

  type tag {
    _id: Long!
    created_at: String!
    discourse_id: Int!
    name: String!
    platform: String!
    topic_count: Int!
    updated_at: String!
    topics: [topic] @relation(name: "TAGGED_WITH", direction: IN)
    codes: [code] @relation(name: "IN_CORPUS", direction: IN)
  }

  type category {
    _id: Long!
    created_at: String
    discourse_id: Int!
    name: String
    name_lower: String
    parent_category_id: Int
    permissions: String
    platform: String!
    read_restricted: Boolean
    updated_at: String
    parent_category_of: [category] @relation(name: "PARENT_CATEGORY_OF", direction: OUT)
    groups: [group] @relation(name: "HAS_ACCESS", direction: IN)
    topics: [topic] @relation(name: "IN_CATEGORY", direction: IN)
  }

  type topic {
    _id: Long!
    category_id: Int!
    created_at: String!
    discourse_id: Int!
    is_message_thread: Boolean!
    platform: String!
    tags: String!
    title: String!
    updated_at: String!
    user_id: Int!
    in_category: [category] @relation(name: "IN_CATEGORY", direction: OUT)
    tagged_with: [tag] @relation(name: "TAGGED_WITH", direction: OUT)
    users: [user] @relation(name: "CREATED", direction: IN)
    posts: [post] @relation(name: "IN_TOPIC", direction: IN)
  }

  type post {
    _id: Long!
    created_at: String!
    deleted_at: String
    discourse_id: Int!
    hidden: Boolean!
    like_count: Int!
    platform: String!
    post_number: Int!
    quote_count: Int!
    raw: String!
    reads: Int!
    reply_count: Int!
    score: String!
    topic_id: Int!
    updated_at: String!
    user_id: Int!
    wiki: Boolean!
    word_count: Int!
    in_topic: [topic] @relation(name: "IN_TOPIC", direction: OUT)
    is_reply_to: [post] @relation(name: "IS_REPLY_TO", direction: OUT)
    contains_quote_from: [post] @relation(name: "CONTAINS_QUOTE_FROM", direction: OUT)
    users: [user] @relation(name: "LIKES", direction: IN)
    annotations: [annotation] @relation(name: "ANNOTATES", direction: IN)
  }

  type language {
    _id: Long!
    discourse_id: Int!
    locale: String!
    name: String!
    platform: String!
    codenames: [codename] @relation(name: "IN_LANGUAGE", direction: IN)
  }

  type code {
    _id: Long!
    ancestry: String
    annotations_count: Int!
    created_at: String!
    creator_id: Int!
    description: String
    discourse_id: Int!
    name: String
    platform: String!
    updated_at: String!
    on_platform: [platform] @relation(name: "ON_PLATFORM", direction: OUT)
    has_parent_code: [code] @relation(name: "HAS_PARENT_CODE", direction: OUT)
    has_codename: [codename] @relation(name: "HAS_CODENAME", direction: OUT)
    cooccurs: [code] @relation(name: "COOCCURS", direction: OUT)
    COOCCURS_rel: [COOCCURS]
    annotations: [annotation] @relation(name: "REFERS_TO", direction: IN)
    users: [user] @relation(name: "USED_CODE", direction: IN)
  }

  type corpus_tag {
    _id: Long!
    created_at: String!
    discourse_id: Int!
    name: String!
    platform: String!
    topic_count: Int!
    updated_at: String!
    codes: [code] @relation(name: "IN_CORPUS", direction: IN)
  }

  type codename {
    _id: Long!
    code_id: Int!
    created_at: String!
    discourse_id: Int!
    language_id: Int!
    name: String!
    platform: String!
    in_language: [language] @relation(name: "IN_LANGUAGE", direction: OUT)
    codes: [code] @relation(name: "HAS_CODENAME", direction: IN)
  }

  type annotation {
    _id: Long!
    code_id: Int
    created_at: String!
    creator_id: Int!
    discourse_id: Int!
    platform: String!
    post_id: Int!
    quote: String
    text: String
    topic_id: Int!
    type: String!
    updated_at: String!
    refers_to: [code] @relation(name: "REFERS_TO", direction: OUT)
    annotates: [post] @relation(name: "ANNOTATES", direction: OUT)
  }

  type platform {
    _id: Long!
    name: String!
    url: String!
    codes: [code] @relation(name: "ON_PLATFORM", direction: IN)
    globalusers: [globaluser] @relation(name: "HAS_ACCOUNT_ON", direction: IN)
    corpus: [corpus_tag]
      @cypher(
        statement: """
        MATCH (this)<-[:ON_PLATFORM]-(:post)-[:IN_TOPIC]->()-[:TAGGED_WITH]->(corpus:corpus)
        RETURN DISTINCT corpus
        """
      )
  }

  type TALKED_TO @relation(name: "TALKED_TO") {
    from: user!
    to: user!
    count: Int!
  }

  type QUOTED @relation(name: "QUOTED") {
    from: user!
    to: user!
    count: Int!
  }

  type TALKED_OR_QUOTED @relation(name: "TALKED_OR_QUOTED") {
    from: user!
    to: user!
    count: Int!
  }

  type COOCCURS @relation(name: "COOCCURS") {
    from: code!
    to: code!
    corpus: String!
    count: Int!
  }

  type USED_CODE @relation(name: "USED_CODE") {
    from: user!
    to: code!
    count: Int!
  }

  #
  # Custom types for the graph
  #
  type Node {
    key: String!
    attributes: JSONObject
  }
  type Edge {
    key: String!
    source: String!
    target: String!
    attributes: JSONObject
  }
  type Graph {
    attributes: JSONObject
    nodes: [Node]
    edges: [Edge]
  }

  type Query {
    getGraphByCorpus(platform: String!, corpora: String!): Graph
  }
`;

export const resolvers = {
  Query: {
    getGraphByCorpus: async (
      parent: GraphQLObjectType,
      params: { platform: string; corpora: string },
      ctx: ResolverContext,
      resolverInfo: GraphQLResolveInfo,
    ): Promise<any> => {
      const query = `
        CALL apoc.graph.fromCypher('
          MATCH
            (platform:platform {name: $name}),
            (corpus:corpus {name: $corpora})
          WITH platform, [(corpus)<-[:TAGGED_WITH]-(topic:topic) | topic] as topics
            MATCH
              p1=(post:post)-[:ON_PLATFORM]->(platform),
              p2=(post)-[:IN_TOPIC]->(topic:topic),
              p3=(post)<-[:CREATED]-(user:user)-[:TALKED_OR_QUOTED]->(user2:user),
              p4=(post)<-[:ANNOTATES*0..1]-(a:annotation)-[:REFERS_TO*0..1]->(c:code),
              p5=(c)-[:IN_CORPUS]->(corpus)
            WHERE topic IN topics
            RETURN p1, p2, p3, p4, p5, [(c)-[r:COOCCURS {corpus: $corpora}]->(c2) | [r, c2]]',
          {corpora:$corpora, name:$platform},
          "",
          {}
        ) YIELD graph AS g
        RETURN g.nodes AS nodes, g.relationships AS edges`;
      log.info(`Asking graph for ${JSON.stringify(params)}`);
      const graph = await cypherToGraph(ctx, query, params);
      graph.setAttribute("platform", params.platform);
      graph.setAttribute("corpora", params.corpora);
      log.info(`Returned computed graph`);
      return graph.export();
    },
  },
};

export const gqlConfig = {
  query: {
    exclude: ["Node", "Edge", "Graph"],
  },
  mutation: false,
};
