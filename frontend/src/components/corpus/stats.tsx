import React from "react";
import config from "../../core/config";
import { DatasetType } from "../../core/data";
import { ModelType, Scope } from "../../types";

interface StatsBoxProps {
  model: ModelType;
  inScope?: number;
  total: number;
  verb?: string;
}
const StatsElement: React.FC<StatsBoxProps> = ({ model, total, inScope, verb }) => {
  const label = model.name + (total > 0 ? "s" : "");
  return (
    <span className="d-flex  align-items-center">
      <span className="fs-2" style={{ marginRight: "0.5rem", color: model.color }}>
        {(!inScope || inScope === 0) && <>{total}</>}
        {inScope && inScope > 0 && (
          <>
            <span style={{ color: config.networkStyle.scopeColor }}>{inScope}</span>
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
  stats: DatasetType["stats"];
  scope: Scope | undefined;
}

export const Stats: React.FC<StatsProps> = ({ stats, scope }) => {
  return (
    <>
      <div className="d-flex justify-content-start flex-wrap">
        <StatsElement
          model={config.models.code}
          total={stats.codes}
          inScope={scope && scope.code ? scope.code.length : 0}
          verb="used in"
        />
        <StatsElement model={config.models.annotation} total={stats.annotations} verb="describes" />
        <StatsElement
          model={config.models.post}
          total={stats.posts}
          inScope={scope && scope.post ? scope.post.length : 0}
          verb="in"
        />
        <StatsElement model={config.models.topic} total={stats.topics} verb="written by" />
        <StatsElement
          model={config.models.user}
          total={stats.users}
          inScope={scope && scope.user ? scope.user.length : 0}
        />
      </div>
    </>
  );
};
