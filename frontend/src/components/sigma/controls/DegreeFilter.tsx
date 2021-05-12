import React, { useEffect, useState } from "react";
import { useSigma } from "../hooks";

interface Props {}

export const DegreeFilter: React.FC<Props> = () => {
  // Get Sigma
  const sigma = useSigma();
  // Value of the degree filter selection
  const [value, setValue] = useState<number>(0);

  useEffect(() => {
    const graph = sigma.getGraph();
    graph.forEachNode((node) => {
      if (graph.degree(node) < value) graph.setNodeAttribute(node, "hidden", true);
      else graph.setNodeAttribute(node, "hidden", false);
    });
  }, [value, sigma]);

  return (
    <input
      type="range"
      min={0}
      max={100}
      value={value}
      step={1}
      onChange={(e) => setValue(Number.parseInt(e.target.value))}
    />
  );
};
