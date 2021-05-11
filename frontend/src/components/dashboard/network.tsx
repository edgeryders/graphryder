import React, { FC, useEffect, useState } from "react";
import { CameraState, MouseCoords } from "sigma/types";
import { NodeKey } from "graphology-types";
import Graph from "graphology";
import { circular } from "graphology-layout";
import {
  ControlsContainer,
  ForceAtlasControl,
  FullScreenControl,
  SigmaContainer,
  ZoomControl,
  useSigma,
  useRegisterEvents,
  useLoadGraph,
  useSetSettings,
} from "../sigma";

export interface NetworkProps {
  graph: Graph;
}

export const MyCustomGraph: React.FC<NetworkProps> = ({ graph }) => {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const loadGraph = useLoadGraph();
  const setSettings = useSetSettings();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    circular.assign(graph);
    loadGraph(graph);

    // Register the events
    registerEvents({
      enterNode: (event: { node: NodeKey }) => setHoveredNode(`${event.node}`),
      leaveNode: (event: { node: NodeKey }) => setHoveredNode(null),
    });
  }, []);

  useEffect(() => {
    setSettings({
      nodeReducer: (node: any, data: any) => {
        const graph = sigma.getGraph();
        const newData = { ...data, size: Math.log(graph.degree(node)), highlighted: false };
        if (hoveredNode) {
          if (node === hoveredNode || graph.neighbors(hoveredNode).includes(node)) newData.highlighted = true;
          else newData.color = "#E2E2E2";
        }
        return newData;
      },
      edgeReducer: (edge: any, data: any) => {
        const graph = sigma.getGraph();
        const newData = { ...data, hidden: false };
        if (hoveredNode && !graph.extremities(edge).includes(hoveredNode)) newData.hidden = true;
        return newData;
      },
    });
  }, [hoveredNode]);

  return null;
};

export const Network: FC<NetworkProps> = ({ graph }) => {
  return (
    <div>
      <SigmaContainer
        style={{ height: "300px" }}
        graphOptions={{ multi: true, type: "directed", allowSelfLoops: true }}
      >
        <MyCustomGraph graph={graph} />
        <ControlsContainer position={"bottom-right"}>
          <ZoomControl />
          <FullScreenControl />
          <ForceAtlasControl autoRunFor={2000} />
        </ControlsContainer>
      </SigmaContainer>
    </div>
  );
};
