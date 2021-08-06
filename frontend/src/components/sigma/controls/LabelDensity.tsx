import React from "react";
import { useSigma } from "react-sigma-v2";

interface Props {
  density: number | null;
  threshold: number | null;
  onChange: (keyValue: { [key: string]: string }) => void;
}

export const LabelDensity: React.FC<Props> = (props) => {
  const { density, threshold, onChange } = props;
  // update sigma setting if needed
  const sigma = useSigma();
  if (density !== null && density !== sigma.getSetting("labelDensity")) sigma.setSetting("labelDensity", density);
  if (threshold !== null && threshold !== sigma.getSetting("labelRenderedSizeThreshold"))
    sigma.setSetting("labelRenderedSizeThreshold", threshold);

  return (
    <div className="react-sigma-control-filters">
      <h6>Labels control</h6>
      <div className="filter">
        <input
          id="labelDensity-filter"
          type="range"
          min={0}
          max={1}
          value={density !== null ? density : sigma.getSetting("labelDensity") || 0.07}
          step={0.01}
          onChange={(e) => {
            onChange({ labelDensity: e.target.value });
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
          value={threshold !== null ? threshold : sigma.getSetting("labelRenderedSizeThreshold") || 6}
          step={1}
          onChange={(e) => {
            onChange({ labelThreshold: e.target.value });
          }}
        />
        <label htmlFor="labelDensity-filter"> size &gt; {threshold}</label>
      </div>
    </div>
  );
};
