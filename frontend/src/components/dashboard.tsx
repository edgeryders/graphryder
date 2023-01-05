import React, { FC, ReactElement, useEffect, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";

import { ScopeBox, Stats } from "./project/stats";
import { queryToState, stateToQueryString } from "../core/queryState";
import { Modules, ModuleType } from "../core/modules";
import { applyScopeOnGraph, DatasetType, loadDataset } from "../core/data";
import { Loader } from "./loader";
import { BoxWrapper } from "./box-wrapper";
import { AvailableModules } from "./dashboard/available-modules";
import { Header } from "./layout/header";
import { NetworkProps } from "./dashboard/network";
import { TableProps } from "./dashboard/table";
import { sortBy } from "lodash";

export const Dashboard: FC<{ platform: string; project: string }> = ({ platform, project }) => {
  const location = useLocation();
  const history = useHistory();
  //TODO put this in a useEffect ?
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
      loadDataset(platform, project, queryState)
        .then((dataset) => setDataset(dataset))
        .catch((err) => {
          console.error(error);
          setError(err);
        })
        .finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, project]);

  // add a useEffect to apply scope when queryState change
  useEffect(() => {
    if (!isLoading && dataset) {
      // set new version of the graph with updated inScope attributes
      setDataset({ ...dataset, ...applyScopeOnGraph(dataset.graph, queryState.scope) });
    }
  }, [isLoading, JSON.stringify(queryState.scope)]);

  const modules = sortBy(
    queryState.modules.map((moduleID) => Modules[moduleID] as ModuleType),
    (m) => (m.component.name === "Network" ? 0 : 1),
  );

  return (
    <>
      <Header platform={platform} project={project} />
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
              <div>
                <ScopeBox state={queryState} />
              </div>
              <div>{dataset && <Stats dataset={dataset} scope={queryState.scope} />}</div>
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
              {!dataset && <Loader />}
              {dataset && (
                <>
                  {modules.map((module) => {
                    const props: NetworkProps | TableProps = {
                      ...module.getProps(queryState, dataset),
                      moduleId: module.id,
                    } as NetworkProps | TableProps;
                    const Component = module.component;

                    return (
                      <div
                        key={module.id}
                        className={`${module.component.name === "Network" ? "network-modules" : "other-modules"}`}
                      >
                        <BoxWrapper
                          onRemove={() => {
                            queryState.modules = queryState.modules.filter((key) => key !== module.id);
                            history.push({ search: stateToQueryString(queryState) });
                          }}
                        >
                          <div className="module-wrapper">
                            <div className="title">
                              <h2>
                                {module.title} (
                                {props && "data" in props ? props.data.rows.length : props.graphData.graph.order})
                              </h2>
                            </div>
                            <Component {...props} />
                          </div>
                        </BoxWrapper>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
