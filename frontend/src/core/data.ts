import Graph from "graphology";
import { cloneDeep, memoize } from "lodash";
import gql from "graphql-tag";
import { client } from "./client";
import config from "./config";
import { QueryState } from "./queryState";

/**
 * Data types:
 * ***********
 */

export interface DatasetType {
  graph: Graph;
  stats: {
    users: number;
    posts: number;
    annotations: number;
    topics: number;
    codes: number;
  };
}

export type TableDataType = (string | number)[][];

/**
 * Data loading:
 * *************
 */
const GRAPHQL_GET_GRAPH = gql`
  query getGraphByCorpus($platform: String!, $corpora: String!) {
    graph: getGraphByCorpus(platform: $platform, corpora: $corpora) {
      attributes
      nodes {
        key
        attributes
      }
      edges {
        key
        source
        target
        attributes
      }
    }
  }
`;

function changeJsonGraphIds(json: any): any {
  const nodeIds: { [key: string]: string } = {};
  // convert node's key
  json.nodes = json.nodes.map((node: any) => {
    let id = node.key;
    Object.keys(config.models).forEach((label) => {
      if (node.attributes.labels && node.attributes.labels.includes(label)) {
        id = node.attributes.properties[config.models[label].id_field];
      }
    });
    nodeIds[node.key] = id;
    return { ...node, key: id };
  });
  json.edges = json.edges.map((edge: any) => {
    return { ...edge, source: nodeIds[edge.source], target: nodeIds[edge.target] };
  });
  return json;
}

export async function loadDataset(platform: string, corpora: string, state: QueryState): Promise<DatasetType> {
  const graph = new Graph({ multi: true, type: "directed", allowSelfLoops: true });
  const result = await client.query({
    query: GRAPHQL_GET_GRAPH,
    variables: { platform, corpora },
  });

  // deepclone is due to graphql that returns a readonly instance
  // changeJsonGraphIds is for replacing neo4j ids by business ids
  const jsonGraph = changeJsonGraphIds(cloneDeep(result.data.graph));

  graph.import(jsonGraph);
  const stats = {
    users: 0,
    posts: 0,
    annotations: 0,
    topics: 0,
    codes: 0,
  };
  graph.forEachNode((key: string, attributes: any) => {
    // compute stats
    if (attributes.labels.includes("user")) stats.users++;
    if (attributes.labels.includes("post")) stats.posts++;
    if (attributes.labels.includes("annotation")) stats.annotations++;
    if (attributes.labels.includes("topic")) stats.topics++;
    if (attributes.labels.includes("code")) stats.codes++;

    // make graph style
    Object.keys(config.models).forEach((label) => {
      if (attributes.labels && attributes.labels.includes(label)) {
        graph.setNodeAttribute(key, "color", config.models[label].color);
        graph.setNodeAttribute(key, "label", attributes["properties"][config.models[label].label_field]);
      }
    });
  });
  return Promise.resolve({ graph, stats });
}

/**
 * Data types translation / extraction:
 * ************************************
 */

function getGraphNaive(dataset: DatasetType, options: unknown): Graph {
  return dataset.graph;
}

function getTableDataNaive(dataset: DatasetType, options: unknown): TableDataType {
  // TODO
  return [];
}

// TODO:
// Check that memoize key is good (and rewrite if needed)
export const getGraph = memoize(getGraphNaive);
export const getTableData = memoize(getTableDataNaive);
