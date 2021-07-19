import React, { useEffect, useState } from "react";
import Graph, { Attributes, EdgeKey, NodeKey } from "graphology-types";
import { useSigma } from "react-sigma-v2";

interface Props {
  min: number;
  max: number;
}

const filterGraph = (graph: Graph, value: number) => {
  const nodesToKeep = new Set<NodeKey>();
  graph.forEachEdge((edge: EdgeKey, edgeAtts: Attributes, source: NodeKey, target: NodeKey) => {
    // TODO : make the param to test weight on a prop ?
    if (edgeAtts.count >= value) {
      // keep edge
      graph.setEdgeAttribute(edge, "hidden", false);
      // keep track of nodes
      nodesToKeep.add(source);
      nodesToKeep.add(target);
    } else graph.setEdgeAttribute(edge, "hidden", true);
  });
  graph.forEachNode((node: NodeKey) => {
    if (nodesToKeep.has(node)) graph.setNodeAttribute(node, "hidden", false);
    else graph.setNodeAttribute(node, "hidden", true);
  });
};

export const DegreeFilter: React.FC<Props> = (props) => {
  const { min: minWeight, max: maxWeight } = props;
  // Get Sigma
  const sigma = useSigma();
  // Value of the degree filter selection
  const [value, setValue] = useState<number>(minWeight);
  //debounce
  const [timeoutID, setTimeoutID] = useState<number | null>(null);

  useEffect(() => {
    // reset value if boundaries changed makes it outbounded
    if (value > maxWeight) setValue(maxWeight);
    if (value < minWeight) setValue(minWeight);
  }, [minWeight, maxWeight]);

  useEffect(() => {
    const graph = sigma.getGraph();

    const update = () =>
      setTimeoutID((oldTimeout) => {
        // reset if needed
        if (oldTimeout) clearTimeout(oldTimeout);
        // throw timeout to debounce
        return window.setTimeout(() => {
          filterGraph(graph, value);
        }, 100);
      });
    // update when triggered by value changed
    update();
    graph.on("nodeAdded", update);
    graph.on("nodeDropped", update);
    graph.on("edgeAdded", update);
    graph.on("edgeDropped", update);

    return () => {
      graph.removeListener("nodeAdded", update);
      graph.removeListener("nodeDropped", update);
      graph.removeListener("edgeAdded", update);
      graph.removeListener("edgeDropped", update);
    };
  }, [sigma, value]);

  return (
    <div className="react-sigma-control-filters">
      <div className="filter">
        <label htmlFor="degre-filter">
          Edge weight {minWeight !== maxWeight ? "≥" : "="} {value}
        </label>
        <input
          id="degree-filter"
          type="range"
          min={minWeight}
          max={maxWeight}
          value={value}
          step={1}
          onChange={(e) => setValue(Number.parseInt(e.target.value))}
          list="degree-filter-tickmarks"
          disabled={minWeight === maxWeight}
        />
      </div>
    </div>
  );
};
