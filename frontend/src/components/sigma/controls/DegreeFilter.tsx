import React, { useEffect, useState } from "react";
import { NodeKey } from "graphology-types";
import { useSigma } from "../hooks";
import { max, min, uniq } from "lodash";

interface Props {}

export const DegreeFilter: React.FC<Props> = () => {
  // Get Sigma
  const sigma = useSigma();
  // Value of the degree filter selection
  const [value, setValue] = useState<number>(0);
  const graph = sigma.getGraph();
  const degrees = uniq(graph.nodes().map((n) => graph.degree(n)));
  const maxDegree = max(degrees);
  const minDegree = min(degrees);

  useEffect(() => {
    const graph = sigma.getGraph();
    graph.forEachNode((node: NodeKey) => {
      if (graph.degree(node) < value) graph.setNodeAttribute(node, "hidden", true);
      else graph.setNodeAttribute(node, "hidden", false);
    });
  }, [value, sigma]);

  return (
    <div className="react-sigma-control-filters">
      <div className="filter">
        <label htmlFor="degre-filter">Degree &gt; {value}</label>
        <input
          id="degree-filter"
          type="range"
          min={minDegree}
          max={maxDegree}
          value={value}
          step={1}
          onChange={(e) => setValue(Number.parseInt(e.target.value))}
          list="degree-filter-tickmarks"
        />
      </div>
    </div>
  );
};
