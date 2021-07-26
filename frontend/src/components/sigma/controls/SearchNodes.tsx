import React from "react";
import { useState } from "react";
import Select, { OptionTypeBase } from "react-select";
import { useSigma } from "react-sigma-v2/lib/esm";
import { Coordinates } from "sigma/types";

interface Props {}

export const SearchNode: React.FC<Props> = (props) => {
  const [search, setSearch] = useState<string>();
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const options = graph
    .nodes()
    .map((id) => {
      const props = graph.getNodeAttributes(id);
      if (props.hidden === true) return null;
      else return { id: id, label: props.label };
    })
    .filter((opt) => search && opt && opt.label.toUpperCase().indexOf(search.toUpperCase()) > -1) as Array<{
    id: string;
    label: string;
  }>;
  options.sort((a, b) => (a.label.toUpperCase() > b.label.toUpperCase() ? 1 : -1));

  const panToNode = (id: string): void => {
    if (!sigma) return;
    const positionToPanTo = sigma.getNodeDisplayData(id) as Coordinates;
    const camera = sigma.getCamera();
    //TODO: adapt zoom level
    camera.animate(positionToPanTo, { easing: "linear", duration: 500 });
  };

  return (
    <div className="react-sigma-control-search">
      <div className="search">
        <Select
          isClearable
          className="react-select"
          classNamePrefix="react-select"
          placeholder="Sélectionner un nœud..."
          options={options}
          filterOption={() => true}
          //value={search}
          inputValue={search}
          noOptionsMessage={({ inputValue }: { inputValue: any }) => {
            if (!inputValue) return null;
            return "No result";
          }}
          onInputChange={(inputValue: string) => {
            setSearch(inputValue);
          }}
          onChange={(value: OptionTypeBase | null) => {
            const id = value && (value as { id: string; label: string }).id;
            if (id) {
              //TODO: add a highlight effect on selected node?
              panToNode(id);
            }
          }}
        />
      </div>
    </div>
  );
};
