import React, { FC, ReactElement, useEffect, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";

import { Stats } from "./corpus/stats";
import { queryToState, stateToQueryString } from "../core/queryState";
import { Modules, ModuleType } from "../core/modules";
import { DatasetType, loadDataset } from "../core/data";
import { Loader } from "./loader";
import { BoxWrapper } from "./box-wrapper";
import { AvailableModules } from "./dashboard/available-modules";
import { Header } from "./layout/header";

export const Dashboard: FC<{ platform: string; corpus: string }> = ({ platform, corpus }) => {
  const location = useLocation();
  const history = useHistory();
  const query = new URLSearchParams(location.search);
  const queryState = queryToState(query);

  const availableModules: Array<ModuleType & { key: string }> = Object.keys(Modules).map((key) => {
    return { ...Modules[key], key, visible: queryState.modules.includes(key) };
  });

  const [dataset, setDataset] = useState<DatasetType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setIsLoading(true);
      loadDataset(platform, corpus, queryState)
        .then((dataset) => setDataset(dataset))
        .catch((err) => {
          console.error(error);
          setError(err);
        })
        .finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, corpus]);

  const renderModule = (module: ModuleType): ReactElement => {
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
        key={module.id}
        onRemove={() => {
          queryState.modules = queryState.modules.filter((key) => key !== module.id);
          history.push({ search: stateToQueryString(queryState) });
        }}
      >
        <div className="module-wrapper">
          <div className="title">
            <h2>{module.title}</h2>
          </div>
          {content}
        </div>
      </BoxWrapper>
    );
  };
  const modules = queryState.modules.map((moduleID) => Modules[moduleID] as ModuleType);
  const networkModules = modules.filter((m) => m.component.name === "Network");
  const otherModules = modules.filter((m) => m.component.name !== "Network");

  return (
    <>
      <Header platform={platform} corpus={corpus} />
      <div className="container-fluid">
        {isLoading && <Loader />}
        {!isLoading && error && (
          <div className="row">
            <h2>Error</h2>
            <div className="error">{error?.message || "Something went wrong..."}</div>
          </div>
        )}
        {!isLoading && !error && (
          <div className="row">
            <div className="col-3 d-flex flex-column">
              <div>{dataset && <Stats stats={dataset.stats} />}</div>
              <div>
                <AvailableModules
                  modules={availableModules}
                  onSelect={(module: ModuleType & { key: string }) => {
                    if (queryState.modules.find((key) => key === module.key)) {
                      queryState.modules = queryState.modules.filter((key) => key !== module.key);
                      history.push({ search: stateToQueryString(queryState) });
                    } else {
                      queryState.modules.push(module.key);
                      history.push({ search: stateToQueryString(queryState) });
                    }
                  }}
                />
              </div>
            </div>
            <div className="col-9 d-flex flex-column full-height modules">
              {networkModules.length > 0 && (
                <div className="network-modules">{networkModules.map((m) => renderModule(m))}</div>
              )}
              {otherModules.length > 0 && (
                <div className="other-modules">{otherModules.map((m) => renderModule(m))}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
