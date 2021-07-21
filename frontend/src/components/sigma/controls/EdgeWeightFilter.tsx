import React, { useEffect } from "react";

interface Props {
  min: number;
  max: number;
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export const EdgeWeightFilter: React.FC<Props> = (props) => {
  const { min: minWeight, max: maxWeight, label, onChange, value } = props;

  useEffect(() => {
    // reset value if boundaries changed makes it outbounded
    if (value > maxWeight) onChange(maxWeight);
    if (value < minWeight) onChange(minWeight);
  }, [minWeight, maxWeight, value, onChange]);

  return (
    <div className="react-sigma-control-filters">
      <div className="filter">
        <label htmlFor="degre-filter">
          {label} {minWeight !== maxWeight ? "≥" : "="} {value}
        </label>
        <input
          id="degree-filter"
          type="range"
          min={minWeight}
          max={maxWeight}
          value={value}
          step={1}
          onChange={(e) => {
            onChange(Number.parseInt(e.target.value));
          }}
          list="degree-filter-tickmarks"
          disabled={minWeight === maxWeight}
        />
      </div>
    </div>
  );
};
