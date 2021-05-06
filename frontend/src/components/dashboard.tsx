import React, { FC, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { queryToState } from "../core/queryState";
import { Modules, ModuleType } from "../core/modules";
import { DatasetType, loadDataset } from "../core/data";
import { Loader } from "./loader";

export const Dashboard: FC<{ platform: string; corpora: string }> = ({ platform, corpora }) => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const queryState = queryToState(query);

  const [dataset, setDataset] = useState<DatasetType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setIsLoading(true);
      loadDataset(platform, corpora, queryState)
        .then((dataset) => setDataset(dataset))
        .catch((err) => setError(err))
        .finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log("dashboard");
  return (
    <div className="dashboard">
      <div className="modules-container">
        {queryState.modules.map((moduleID) => {
          const module = Modules[moduleID] as ModuleType;
          let content: JSX.Element | null = null;

          if (!dataset) {
            content = <Loader />;
          } else {
            const props = module.getProps(queryState, dataset);
            const Component = module.component;
            content = <Component {...props} />;
          }

          return (
            <div className="module-wrapper" key={moduleID}>
              <h2>{module.title}</h2>
              {content}
            </div>
          );
        })}
      </div>
      {error && <div className="error">{error?.message || "Something went wrong..."}</div>}
    </div>
  );
};
