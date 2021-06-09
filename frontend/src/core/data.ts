import Graph, { DirectedGraph, UndirectedGraph } from "graphology";
import { cloneDeep, keyBy, keys, memoize, values } from "lodash";
import gql from "graphql-tag";
import { client } from "./client";
import config from "./config";
import { QueryState } from "./queryState";
import { PlainObject } from "sigma/types";
import { TableColumn } from "../types";

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

export type TableDataType = {
  rows: PlainObject[];
  columns: TableColumn[];
  label: string;
};

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
  const nodeKeys: { [key: string]: string } = {};
  // convert node's key
  const nodes = json.nodes.map((node: any) => {
    let id = node.key;
    Object.keys(config.models).forEach((label) => {
      if (node.attributes.labels && node.attributes.labels.includes(label)) {
        // create a uniqu identifier from node properties
        id = config.models[label].uniq_id(node.attributes);
      }
    });

    // we already have seen this id
    if (nodeKeys[id])
      console.debug(
        `duplicated uniq id ${id} for keys ${nodeKeys[id]} and ${node.key}\n incoming ${JSON.stringify(node)}`,
      );

    nodeIds[node.key] = id;
    nodeKeys[id] = node.key;
    return { ...node, key: id, neo4jId: node.key };
  });
  const edges = json.edges.map((edge: any) => {
    return { ...edge, source: nodeIds[edge.source], target: nodeIds[edge.target] };
  });
  return { ...json, nodes, edges };
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
        graph.setNodeAttribute(key, "model", label);
      }
    });
  });
  return Promise.resolve({ graph, stats });
}

/**
 * Data types translation / extraction:
 * ************************************
 */

const keepNodesFromOption = (nodeLabels: string[]) => (nodeAtts: PlainObject): boolean =>
  nodeLabels.length === 0 || nodeLabels.some((t) => nodeAtts.labels.includes(t));

export interface GraphOptions {
  nodeLabels: string[];
  edgeTypes: string[];
  scope?: any; //TODO: define scope type
}

function filterGraph(dataset: DatasetType, options: GraphOptions): Graph {
  const graph = new Graph({ type: "directed", allowSelfLoops: true });
  // utils
  const keepNode = keepNodesFromOption(options.nodeLabels);
  const keepEdge = (edgeAtts: PlainObject): boolean =>
    options.edgeTypes.length === 0 || options.edgeTypes.includes(edgeAtts.type);

  // iterate first on nodes to keep isolated node into filtered graph
  dataset.graph.forEachNode((node, atts) => {
    if (keepNode(atts)) {
      graph.addNode(node, atts);
    }
  });
  graph.forEachNode((node) => {
    dataset.graph.forEachOutEdge(node, (edge, atts, source, target, sourceAtts, targetAtts) => {
      try {
        if (keepEdge(atts) && keepNode(sourceAtts) && keepNode(targetAtts))
          graph.addEdgeWithKey(edge, source, target, atts);
      } catch (e) {
        console.error(`duplicated edge ${edge}`);
        console.debug(edge, source, target, graph.edge(source, target), graph.getEdgeAttributes(source, target), atts);
      }
    });
  });
  console.debug(
    `fitlered dataset graph (${dataset.graph.size} ${dataset.graph.order}) to ${graph.size} ${
      graph.order
    } using ${JSON.stringify(options, undefined, 2)}`,
  );
  return graph;
}

export interface TableOptions {
  nodeLabel: string;
  scope?: any; //TODO: define scope type
}

function getTableDataNaive(dataset: DatasetType, options: TableOptions): TableDataType {
  // column preparation
  const columnsFromAttributes = (nodeAttributes: PlainObject): PlainObject =>
    config.models[options.nodeLabel].tableColumns.reduce((columns, column) => {
      if (nodeAttributes.properties[column.property])
        return { ...columns, [column.property]: nodeAttributes.properties[column.property] };
      else return columns;
    }, {});
  // utils
  const keepNode = keepNodesFromOption([options.nodeLabel]);
  const tableData: PlainObject[] = [];
  dataset.graph.forEachNode((n, atts) => {
    if (keepNode(atts)) {
      tableData.push({ key: n, ...columnsFromAttributes(atts) });
    }
  });
  return { label: options.nodeLabel, rows: tableData, columns: config.models[options.nodeLabel].tableColumns };
}

// TODO:
// Check that memoize key is good (and rewrite if needed)
export const getGraph = memoize(filterGraph, (dataset, options) => JSON.stringify({ ...dataset.stats, ...options }));
export const getTableData = memoize(getTableDataNaive, (dataset, options) =>
  JSON.stringify({ ...dataset.stats, ...options }),
);
