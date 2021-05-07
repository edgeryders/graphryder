import React, { FC, useEffect, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";

import { CorpusSelection } from "./corpus/selection";
import { Stats } from "./corpus/stats";
import { queryToState, stateToQueryString } from "../core/queryState";
import { Modules, ModuleType } from "../core/modules";
import { DatasetType, loadDataset } from "../core/data";
import { Loader } from "./loader";
import { BoxWrapper } from "./box-wrapper";
import { AvailableModules } from "./dashboard/available-modules";

export const Dashboard: FC<{ platform: string; corpora: string }> = ({ platform, corpora }) => {
  const location = useLocation();
  const history = useHistory();
  const query = new URLSearchParams(location.search);
  const queryState = queryToState(query);

  const availableModules: Array<ModuleType & { key: string }> = Object.keys(Modules)
    .filter((key) => !queryState.modules.includes(key))
    .map((key) => {
      return { ...Modules[key], key };
    });

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

  return (
    <>
      <CorpusSelection platform={platform} corpora={corpora} />

      {dataset && <Stats stats={dataset.stats} />}

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
          <BoxWrapper
            key={moduleID}
            onRemove={() => {
              queryState.modules = queryState.modules.filter((key) => key !== moduleID);
              history.push({ search: stateToQueryString(queryState) });
            }}
          >
            <div className="module-wrapper">
              <h2>{module.title}</h2>
              {content}
            </div>
          </BoxWrapper>
        );
      })}

      <AvailableModules
        modules={availableModules}
        onClick={(module: ModuleType & { key: string }) => {
          queryState.modules.push(module.key);
          history.push({ search: stateToQueryString(queryState) });
        }}
      />

      {error && <div className="error">{error?.message || "Something went wrong..."}</div>}
    </>
  );
};
