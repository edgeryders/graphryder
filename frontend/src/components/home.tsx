import React from "react";
import { CorpusSelection } from "./corpus/selection";

export const Home: React.FC<{}> = () => {
  return (
    <div className="container home">
      <div>
        <h1 className="head">RyderEx</h1>
        <CorpusSelection />
      </div>
    </div>
  );
};
