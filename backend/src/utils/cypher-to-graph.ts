import Graph from "graphology";
import {
  session,
  Driver,
  Neo4jError,
  Node,
  Path,
  PathSegment,
  Record,
  Relationship,
  ResultSummary,
  Session,
} from "neo4j-driver";

interface Vertex {
  labels: Array<string>;
  properties: { [key: string]: any };
}

interface Edge {
  type: string;
  properties: { [key: string]: any };
}

/**
 * Create a graphology graph based on the result of a cypher query.
 * @param neo4j Object with the neo4j's driver and (optional) the database name
 * @param cypher The query to executed to create the graph
 * @param params The query's parameters
 * @returns A graphology instance
 */
export function cypherToGraph(
  neo4j: { driver: Driver; database?: string },
  cypher: string,
  params: { [param: string]: any } = {},
): Promise<Graph> {
  return new Promise<Graph>((resolve, reject) => {
    const graph = new Graph({ multi: true, type: "directed", allowSelfLoops: true });

    const neoSession: Session = neo4j.driver.session({ defaultAccessMode: session.READ, database: neo4j.database });
    neoSession.run(cypher, params).subscribe({
      onNext: (record: Record) => {
        // for each column
        record.forEach((value: unknown, key: string) => {
          try {
            pushValueInGraph(value, graph);
          } catch (e) {
            reject(e);
          }
        });
      },
      onCompleted: (summary: ResultSummary) => {
        neoSession.close();
        resolve(graph);
      },
      onError: (error: Neo4jError) => {
        neoSession.close();
        reject(error);
      },
    });
  });
}

function pushValueInGraph(value: unknown, graph: Graph): void {
  // check if it's a node
  if (isNode(value)) {
    mergeNodeInGraph(value as Node, graph);
  }
  // check if it's a Relationship
  else if (isRelationship(value)) {
    mergeRelationshipInGraph(value as Relationship, graph);
  }
  // check if it's a Path
  else if (isPath(value)) {
    const path = value as Path;
    mergeNodeInGraph(path.start, graph);
    path.segments.forEach((seg: PathSegment) => {
      mergeNodeInGraph(seg.start, graph);
      mergeRelationshipInGraph(seg.relationship, graph);
      mergeNodeInGraph(seg.end, graph);
    });
  } else if (Array.isArray(value)) {
    value.forEach((item: any) => {
      pushValueInGraph(item, graph);
    });
  } else if (Object.prototype.toString.call(value) === "[object Object]") {
    Object.keys(value).forEach((key) => {
      pushValueInGraph(value[key], graph);
    });
  }
}

/**
 * Convert a Neo4j Node object and merge it into the graph instance.
 * NOTE: This method modifies the provided graph instance.
 * @param node The Neo4j node to merge in the graph
 * @param graph The graph instance in which the node will be added.
 */
function mergeNodeInGraph(node: Node, graph: Graph): void {
  const vertex: Vertex = {
    labels: node.labels,
    properties: node.properties,
  };
  graph.mergeNode(`${node.identity}`, vertex);
}

/**
 * Convert a Neo4j Relatonship object and merge it into the graph instance.
 * NOTE: This method modifies the provided graph instance.
 * @param rel The Neo4j relatiponship to merge in the graph
 * @param graph The graph instance in which the node will be added.
 */
function mergeRelationshipInGraph(rel: Relationship, graph: Graph): void {
  const edge: Edge = {
    type: rel.type,
    properties: rel.properties,
  };
  graph.mergeEdgeWithKey(`${rel.identity}`, `${rel.start}`, `${rel.end}`, edge);
}

/**
 * Given an object returned by the neo4j driver, this method check if it's a Node or not.
 * @param object The cypher object to check
 * @returns `true` if the object is a Node, `false` otherwise
 */
function isNode(object: unknown): boolean {
  let isNode = false;
  if (object && object.hasOwnProperty("identity") && object.hasOwnProperty("labels")) {
    isNode = true;
  }
  return isNode;
}

/**
 * Given an object returned by the neo4j driver, this method check if it's a Relationship or not.
 * @param object The cypher object to check
 * @returns `true` if the object is a Relationship, `false` otherwise
 */
function isRelationship(object: unknown): boolean {
  let isRel = false;
  if (
    object &&
    object.hasOwnProperty("identity") &&
    object.hasOwnProperty("type") &&
    object.hasOwnProperty("start") &&
    object.hasOwnProperty("end")
  ) {
    isRel = true;
  }
  return isRel;
}

/**
 * Given an object returned by the neo4j driver, this method check if it's a path or not.
 * @param object The cypher object to check
 * @returns `true` if the object is a Path, `false` otherwise
 */
function isPath(object: unknown): boolean {
  let isPath = false;
  if (object && object.hasOwnProperty("start") && object.hasOwnProperty("end") && object.hasOwnProperty("segments")) {
    isPath = true;
  }
  return isPath;
}
