import React from "react";
import { ProjectSelection } from "./project/selection";

export const Home: React.FC<{}> = () => {
  return (
    <div className="container home">
      <div>
        <h1 className="head">Graphryder</h1>
        <ProjectSelection />
      </div>
    </div>
  );
};
