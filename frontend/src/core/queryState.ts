import { forIn, toPairs } from "lodash";
import { PlainObject } from "sigma/types";
import { Scope } from "../types";

import { Modules } from "./modules";
import pako from "pako";

const MODULES_KEY = "m";
const MODULES_SEPARATOR = "|";

export interface ModuleState {
  [key: string]: string;
}

export interface QueryState {
  modules: string[];
  modulesStates: Record<string, ModuleState>;
  scope?: Scope;
}

export function queryToState(query: URLSearchParams): QueryState {
  const modules = (query.get(MODULES_KEY) || "").split(MODULES_SEPARATOR).filter((str) => !!Modules[str]);
  const modulesStates: Record<string, ModuleState> = {};
  const scope: PlainObject = {};
  query.forEach((value, queryKey) => {
    const [module, key] = queryKey.split(".");
    if (modules.includes(module) && !!Modules[module] && key) {
      modulesStates[module] = modulesStates[module] || {};
      modulesStates[module][key] = value;
    }
    //scope
    if (module === "sc" && ["code", "user", "post"].includes(key)) {
      scope[key] = deHashNodeIds(value);
    }
  });

  return { modules, modulesStates, scope };
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
  //scope
  if (state.scope) {
    forIn(state.scope, (ids, label) => {
      if (ids && ids.length > 0) queryObject[`sc.${label}`] = hashNodeIds(ids);
    });
  }
  return toPairs(queryObject)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

const hashNodeIds = (ids: string[]) => {
  if (ids.length > 0) {
    const original = ids.join("|");
    // we use compression to save character in URL. Caveats: ugly urls
    const compressed = pako.deflate(original, { to: "string" });
    return compressed;
  } else return "";
};
const deHashNodeIds = (idsHashed: string) => {
  const decompressed = pako.inflate(idsHashed, { to: "string" }).split("|");
  return decompressed;
};
