import React, { FC, useEffect } from "react";
import Graph from "graphology";
import { circular } from "graphology-layout";
import {
  ControlsContainer,
  ForceAtlasControl,
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

  useEffect(() => {
    circular.assign(graph);
    loadGraph(graph);

    // Register the events
    registerEvents({
      enterNode: (event) => {
        const graph = sigma.getGraph();
        graph.updateEachNodeAttributes((node: any, attr: any) => {
          return { ...attr, background: true, highlighted: false };
        });
        graph.setNodeAttribute(event.node, "background", false);
        graph.setNodeAttribute(event.node, "highlighted", true);
        graph.setNodeAttribute(event.node, "selected", true);
        graph.forEachNeighbor(event.node, (node, data) => {
          graph.setNodeAttribute(node, "background", false);
          graph.setNodeAttribute(node, "highlighted", true);
        });
        sigma.refresh();
      },
      leaveNode: (event) => {
        const graph = sigma.getGraph();
        graph.updateEachNodeAttributes((node: any, attr: any) => {
          attr.highlighted = false;
          attr.background = false;
          attr.selected = false;
          return attr;
        });
        sigma.refresh();
      },
    });

    setSettings({
      nodeReducer: (node: any, data: any) => {
        if (data.background) return { ...data, color: "#eee", label: "" };
        data.size = 5;
        return data;
      },
      edgeReducer: (edge: any, data: any) => {
        const graph = sigma.getGraph();
        const nodes = graph.extremities(edge).map((node) => graph.getNodeAttributes(node));
        if (nodes && (nodes[0].background || nodes[1].background)) return { ...data, hidden: true };
        if (nodes && (nodes[0].selected || nodes[1].selected)) return { ...data, color: "#000", hidden: false };
        return { ...data, color: "#aaa", hidden: false };
      },
    });
  }, []);

  return null;
};

export const Network: FC<NetworkProps> = ({ graph }) => {
  return (
    <div>
      <SigmaContainer style={{ height: "300px" }}>
        <MyCustomGraph graph={graph} />
        <ControlsContainer position={"bottom-right"}>
          <ZoomControl />
          <ForceAtlasControl autoRunFor={2000} />
        </ControlsContainer>
      </SigmaContainer>
    </div>
  );
};
