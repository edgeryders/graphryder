import Graph, { DirectedGraph, UndirectedGraph } from "graphology";
import { cloneDeep, memoize } from "lodash";
import gql from "graphql-tag";
import { client } from "./client";
import config from "./config";
import { QueryState } from "./queryState";
import { PlainObject } from "sigma/types";
import { Scope, TableColumn } from "../types";
import { NodeKey } from "graphology-types";

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

// graph traversal utils
const postInCodeScope = (graph: Graph, codeScope: string[] | undefined, post: string | null): boolean => {
  return (
    !codeScope ||
    (!!post &&
      graph.inEdges(post).some((inLinkPost) => {
        const anotation = graph.getEdgeAttribute(inLinkPost, "type") === "ANNOTATES" ? graph.source(inLinkPost) : null;
        return (
          anotation &&
          graph.outEdges(anotation).some((outLinkAnot) => {
            const code = graph.getEdgeAttribute(outLinkAnot, "type") === "REFERS_TO" ? graph.target(outLinkAnot) : null;
            // does tu user created a post which was annotated by a scope code?
            return code && codeScope.includes(code);
          })
        );
      }))
  );
};
const postInUserScope = (graph: Graph, userScope: string[] | undefined, post: string | null): boolean => {
  return (
    !userScope ||
    (!!post &&
      graph.inEdges(post).some((inLinkPost) => {
        // post <- [:CREATED] - user
        // was this post created by a scope.user?
        return graph.getEdgeAttribute(inLinkPost, "type") === "CREATED" && userScope.includes(graph.source(inLinkPost));
      }))
  );
};
const keepNodesFromOption = (graph: Graph, options: GraphOptions) => (node: string, nodeAtts: PlainObject): boolean => {
  const { nodeLabels, scope } = options;
  // keep only nodes asked in options though label filter
  if (
    nodeLabels.length === 0 ||
    (nodeLabels.length !== 0 && !nodeLabels.some((t: string) => nodeAtts.labels.includes(t)))
  )
    return false;

  // check scope
  if (scope) {
    // scope application on code nodes
    if (nodeAtts.model === "code" && (scope.user || scope.post))
      return graph.inNeighbors(node).some((annotation) => {
        // does the node has an annotation ?
        if (graph.getNodeAttribute(annotation, "labels").includes("annotation")) {
          // code <- Anotation -> post
          const posts = graph.outNeighbors(annotation);
          return (
            // does posts contains a scope.post?
            (!scope.post || posts.some((post) => scope.post.includes(post))) && // This AND could a OR depending on how we want multiscope variable to be cumulative or assortative
            // was on of posts created by a scope.user ?
            (!scope.user || posts.some((post) => postInUserScope(graph, scope.user, post)))
          );
        }
        return false;
      });
    // scope application on user node
    if (nodeAtts.model === "user" && (scope.code || scope.post))
      return graph.outEdges(node).some((outLinkUser) => {
        // user - [:CREATED] -> post
        const post = graph.getEdgeAttribute(outLinkUser, "type") === "CREATED" ? graph.target(outLinkUser) : null;
        // does the user has created posts  ?
        return (
          (!scope.post || (post && scope.post.includes(post))) && // This AND could a OR depending on how we want multiscope variable to be cumulative or assortative
          // post <- anotation -> code
          postInCodeScope(graph, scope.code, post)
        );
      });
    // scope application on post node
    if (nodeAtts.model === "post" && (scope.code || scope.user)) {
      return (
        // post <- [:CREATED] - user
        postInUserScope(graph, scope.user, node) && // This AND could a OR depending on how we want multiscope variable to be cumulative or assortative
        // post <- anotation -> code
        postInCodeScope(graph, scope.code, node)
      );
    }
  }
  // no scope or no scope applied => we keep the node
  return true;
};

export interface GraphOptions {
  nodeLabels: string[];
  edgeTypes?: string[];
  scope: Scope | undefined;
}

function filterGraph(dataset: DatasetType, options: GraphOptions): Graph {
  const graph = new Graph({ type: "directed", allowSelfLoops: true });
  // utils
  const keepNode = keepNodesFromOption(dataset.graph, options);
  const keepEdge = (edgeAtts: PlainObject): boolean =>
    !!options.edgeTypes && (options.edgeTypes.length === 0 || options.edgeTypes.includes(edgeAtts.type));

  // iterate first on nodes to keep isolated node into filtered graph
  dataset.graph.forEachNode((node, atts) => {
    if (keepNode(node, atts)) {
      graph.addNode(node, atts);
    }
  });
  graph.forEachNode((node) => {
    dataset.graph.forEachOutEdge(node, (edge, atts, source, target, sourceAtts, targetAtts) => {
      try {
        if (graph.hasNode(source) && graph.hasNode(target) && keepEdge(atts))
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
  scope: Scope | undefined;
}

function getTableDataNaive(dataset: DatasetType, options: TableOptions): TableDataType {
  // column preparation
  const columnsFromAttributes = (node: string, nodeAttributes: PlainObject): PlainObject =>
    config.models[options.nodeLabel].tableColumns.reduce((columns, column) => {
      if (nodeAttributes.properties[column.property])
        return { ...columns, [column.property]: nodeAttributes.properties[column.property] };
      else if (column.generateFromNode)
        return { ...columns, [column.property]: column.generateFromNode(dataset.graph, node) };
      else return columns;
    }, {});
  // utils
  const keepNode = keepNodesFromOption(dataset.graph, { scope: options.scope, nodeLabels: [options.nodeLabel] });
  const tableData: PlainObject[] = [];
  dataset.graph.forEachNode((n, atts) => {
    if (keepNode(n, atts)) {
      tableData.push({ key: n, ...columnsFromAttributes(n, atts) });
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
