import React from "react";
import config from "../../core/config";
import { DatasetType } from "../../core/data";
import { ModelType, Scope } from "../../types";

interface StatsBoxProps {
  model: ModelType;
  inScopeArea?: number;
  total: number;
  verb?: string;
}
const StatsElement: React.FC<StatsBoxProps> = ({ model, total, inScopeArea, verb }) => {
  const label = model.name + (total > 0 ? "s" : "");
  return (
    <span className="d-flex  align-items-center">
      <span className="fs-2" style={{ marginRight: "0.5rem", color: model.color }}>
        {(!inScopeArea || inScopeArea === total) && <>{total}</>}
        {inScopeArea && inScopeArea > 0 && inScopeArea !== total && (
          <>
            <span style={{ color: model.color }}>{inScopeArea}</span>
            <sub>/{total}</sub>
          </>
        )}
      </span>
      <span style={{ marginRight: "0.5rem", color: model.color }}>
        <i className={`fas fa-${model.icon}`} title={label}></i> <small>{label}</small>
      </span>
      {verb && <span style={{ marginRight: "0.5rem" }}>{verb}</span>}
    </span>
  );
};

interface StatsProps {
  dataset: DatasetType;
  scope: Scope | undefined;
}

export const Stats: React.FC<StatsProps> = ({ dataset, scope }) => {
  // TODO: add scope manipulation buttons
  const { stats, inScopeAreaStats: inScopeStats } = dataset;
  return (
    <>
      <div className="d-flex justify-content-start flex-wrap">
        <StatsElement
          model={config.models.code}
          total={stats.code}
          inScopeArea={(inScopeStats && inScopeStats.code) || 0}
          verb="used in"
        />
        <StatsElement model={config.models.annotation} total={stats.annotation} verb="describes" />
        <StatsElement
          model={config.models.post}
          total={stats.post}
          inScopeArea={(inScopeStats && inScopeStats.post) || 0}
          verb="in"
        />
        <StatsElement model={config.models.topic} total={stats.topic} verb="written by" />
        <StatsElement
          model={config.models.user}
          total={stats.user}
          inScopeArea={(inScopeStats && inScopeStats.user) || 0}
        />
      </div>
    </>
  );
};
