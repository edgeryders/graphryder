import React, { useRef } from "react";
import { DatasetType } from "../../core/data";
import { BoxWrapper } from "./../box-wrapper";

interface StatsBoxProps {
  icon: string;
  stat: number;
  name: string;
}
const StatsBox: React.FC<StatsBoxProps> = ({ icon, stat, name }) => {
  return (
    <BoxWrapper className="col-2 d-flex flex-column align-items-center">
      <i className={`fas fa-${icon}`}></i>
      <span className="fs-2">{stat}</span>
      <span>{name}</span>
    </BoxWrapper>
  );
};

interface StatsProps {
  stats: DatasetType["stats"];
}

export const Stats: React.FC<StatsProps> = ({ stats }) => {
  return (
    <div className="d-flex justify-content-between">
      <StatsBox icon="user-alt" name="Contributors" stat={stats.users} />
      <StatsBox icon="file-alt" name="Posts" stat={stats.posts} />
      <StatsBox icon="pencil-alt" name="Annotations" stat={stats.annotations} />
      <StatsBox icon="question" name="Topics" stat={stats.topics} />
      <StatsBox icon="code" name="Codes" stat={stats.codes} />
    </div>
  );
};
