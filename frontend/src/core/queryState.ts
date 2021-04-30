import { forIn, toPairs } from "lodash";

import { Modules } from "./modules";

const MODULES_KEY = "m";
const MODULES_SEPARATOR = "|";

export interface ModuleState {
  [key: string]: string;
}

export interface QueryState {
  modules: string[];
  modulesStates: Record<string, ModuleState>;
}

export function queryToState(query: URLSearchParams): QueryState {
  const modules = (query.get(MODULES_KEY) || "").split(MODULES_SEPARATOR).filter((str) => !!Modules[str]);
  const modulesStates: Record<string, ModuleState> = {};

  query.forEach((value, queryKey) => {
    const [module, key] = queryKey.split(".");
    if (!!Modules[module] && key) {
      modulesStates[module] = modulesStates[module] || {};
      modulesStates[module][key] = value;
    }
  });

  return { modules, modulesStates };
}

export function stateToQueryString(state: QueryState): string {
  const queryObject: Record<string, string> = {
    [MODULES_KEY]: state.modules.join(MODULES_SEPARATOR),
  };

  forIn(state.modulesStates, (moduleState, moduleID) => {
    forIn(moduleState, (value, key) => {
      queryObject[`${moduleID}.${key}`] = value + "";
    });
  });

  return toPairs(queryObject)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}
