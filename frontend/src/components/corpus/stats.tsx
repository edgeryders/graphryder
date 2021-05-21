import React from "react";
import config from "../../core/config";
import { DatasetType } from "../../core/data";
import { ModelType } from "../../types";

interface StatsBoxProps {
  model: ModelType;
  stat: number;
  verb?: string;
}
const StatsElement: React.FC<StatsBoxProps> = ({ model, stat, verb }) => {
  const label = model.label + (stat > 0 ? "s" : "");
  return (
    <span className="d-flex  align-items-center">
      <span className="fs-2" style={{ marginRight: "0.5rem", color: model.color }}>
        {stat}
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
}

export const Stats: React.FC<StatsProps> = ({ stats }) => {
  return (
    <>
      <div className="d-flex justify-content-start flex-wrap">
        <StatsElement model={config.models.code} stat={stats.codes} verb="used in" />
        <StatsElement model={config.models.annotation} stat={stats.annotations} verb="describes" />
        <StatsElement model={config.models.post} stat={stats.posts} verb="in" />
        <StatsElement model={config.models.topic} stat={stats.topics} verb="written by" />
        <StatsElement model={config.models.user} stat={stats.users} />
      </div>
    </>
  );
};
