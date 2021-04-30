import React, { FC } from "react";
import Graph from "graphology";

export interface NetworkProps {
  graph: Graph;
}

export const Network: FC<NetworkProps> = () => {
  return <div>[network component]</div>;
};
