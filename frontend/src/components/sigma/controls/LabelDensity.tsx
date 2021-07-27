import React from "react";
import { useState } from "react";
import { useSigma } from "react-sigma-v2";

interface Props {}

export const LabelDensity: React.FC<Props> = (props) => {
  const sigma = useSigma();
  const [density, setDensity] = useState<number>(sigma.getSetting("labelDensity") || 0.07);
  const [threshold, setThreshold] = useState<number>(sigma.getSetting("labelRenderedSizeThreshold") || 6);
  return (
    <div className="react-sigma-control-filters">
      <h6>Labels control</h6>
      <div className="filter">
        <input
          id="labelDensity-filter"
          type="range"
          min={0}
          max={1}
          value={density}
          step={0.01}
          onChange={(e) => {
            setDensity(+e.target.value);
            sigma.setSetting("labelDensity", +e.target.value);
          }}
        />
        <label htmlFor="labelDensity-filter"> density {density}</label>
      </div>
      <div className="filter">
        <input
          id="labelThreshold-filter"
          type="range"
          min={0}
          max={20}
          value={threshold}
          step={1}
          onChange={(e) => {
            setThreshold(+e.target.value);
            sigma.setSetting("labelRenderedSizeThreshold", +e.target.value);
          }}
        />
        <label htmlFor="labelDensity-filter"> size &gt; {threshold}</label>
      </div>
    </div>
  );
};
