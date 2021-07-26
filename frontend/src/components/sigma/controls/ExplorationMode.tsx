import React from "react";

interface Props {
  model: string;
  checked: string;
  onChange: (value: string) => void;
}

export const ExplorationMode: React.FC<Props> = (props) => {
  const { model, checked, onChange } = props;
  const name = `${model}explorationMode`;
  return (
    <div className="react-sigma-control-filters">
      <h6>Exploration Mode</h6>
      <div>
        <input
          type="radio"
          name={name}
          value="scopeArea"
          id={`${model}scopeAreaRadio`}
          checked={!checked || checked === "scopeArea"}
          onChange={(e) => onChange(e.target.value)}
        />
        <label htmlFor={`${model}scopeAreaRadio`}>{model}s in scope area</label>
      </div>
      <div>
        <input
          type="radio"
          name={name}
          value="scopeAreaNeighborhood"
          id={`${model}scopeAreaNeighborhoodRadio`}
          checked={checked === "scopeAreaNeighborhood"}
          onChange={(e) => onChange(e.target.value)}
        />
        <label htmlFor={`${model}scopeAreaNeighborhoodRadio`}>{model}s in scope area neighborhood</label>
      </div>
      <div>
        <input
          type="radio"
          name={name}
          value="all"
          id={`${model}allRadio`}
          checked={checked === "all"}
          onChange={(e) => onChange(e.target.value)}
        />
        <label htmlFor={`${model}allRadio`}>all {model}s</label>
      </div>
    </div>
  );
};
