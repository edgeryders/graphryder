import React, { FC, useEffect, useState } from "react";
import { NodeKey } from "graphology-types";
import Graph from "graphology";
import { circular } from "graphology-layout";
import {
  ControlsContainer,
  DegreeFilter,
  ForceAtlasControl,
  SigmaContainer,
  ZoomControl,
  useSigma,
  useRegisterEvents,
  useLoadGraph,
  useSetSettings,
} from "../sigma";
import { queryToState } from "../../core/queryState";
import { useLocation } from "react-router";
import config from "../../core/config";
import NodeWithCirclesProgram from "../sigma/node-with-circles/node-with-circles-program";
import drawHoverWithCircles from "../sigma/node-with-circles/node-with-circles-hover";

export interface NetworkProps {
  graph: Graph;
}

export const Sigma: React.FC<NetworkProps> = ({ graph }) => {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const loadGraph = useLoadGraph();
  const setSettings = useSetSettings();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // selection management
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  // rerenderer if module layout changed
  const location = useLocation();
  const state = queryToState(new URLSearchParams(location.search));
  useEffect(() => {
    sigma.refresh();
  }, [JSON.stringify(state.modules)]);

  // Load data
  useEffect(() => {
    circular.assign(graph);
    loadGraph(graph);

    // Register the events
    registerEvents({
      enterNode: (event: { node: NodeKey }) => setHoveredNode(`${event.node}`),
      leaveNode: (event: { node: NodeKey }) => setHoveredNode(null),
      clickNode: (event: { node: NodeKey }) => {
        setSelectedNodes((oldSelection) => {
          let newSelection = new Set<string>();
          if (!oldSelection.has(event.node + "")) newSelection = new Set<string>([...oldSelection, "" + event.node]);
          else newSelection = new Set<string>([...oldSelection].filter((n) => n !== "" + event.node));
          return newSelection;
        });
      },
    });
  }, [graph]);

  useEffect(() => {
    // affect rendering from state
    //nodeReducer has be reused in hoverRenderer until a sigma issue is resolved
    const nodeReducer = (node: any, data: any) => {
      const graph = sigma.getGraph();
      // the model attributes has to be reloaded from graph until a sigma issue is resolved
      const model = graph.getNodeAttribute(node, "model");
      const newData: any = {
        ...data,
        color: config.models[model].color,
        size: graph.degree(node) !== 0 ? Math.log(graph.degree(node)) : 1,
        highlighted: false,
        dotColor: selectedNodes.has(node) ? "#FFFFFF" : null,
        insideColor:
          !!state.scope && !!state.scope[model] && state.scope[model].includes(node)
            ? config.networkStyle.scopeColor
            : null,
      };
      if (hoveredNode) {
        if (node === hoveredNode || graph.neighbors(hoveredNode).includes(node)) newData.highlighted = true;
        else newData.color = "#E2E2E2";
      }
      return newData;
    };
    setSettings({
      nodeReducer,
      edgeReducer: (edge: any, data: any) => {
        const graph = sigma.getGraph();
        const newData = { ...data, hidden: false };
        if (hoveredNode && !graph.extremities(edge).includes(hoveredNode)) newData.hidden = true;
        return newData;
      },
      hoverRenderer: (context, data, settings) => {
        // reusing nodeReducer here as an issue in Sigma cause node attributes to be ignored in he hover renderer
        return drawHoverWithCircles(context, { ...nodeReducer(data.key, data), ...data }, settings);
      },
    });
  }, [hoveredNode, setSettings, sigma, JSON.stringify(state.scope), selectedNodes]);

  return null;
};

export const Network: FC<NetworkProps> = ({ graph }) => {
  return (
    <SigmaContainer
      graphOptions={{ multi: true, type: "directed", allowSelfLoops: true }}
      initialSettings={{
        nodeProgramClasses: { circle: NodeWithCirclesProgram },
      }}
    >
      <Sigma graph={graph} />
      <ControlsContainer position={"bottom-right"}>
        <ZoomControl />
        <ForceAtlasControl autoRunFor={2000} />
      </ControlsContainer>
      <ControlsContainer position={"bottom-left"}>
        <DegreeFilter />
      </ControlsContainer>
    </SigmaContainer>
  );
};
