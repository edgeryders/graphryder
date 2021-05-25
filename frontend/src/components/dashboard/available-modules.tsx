import { ModuleType } from "../../core/modules";
import { ImTable2 } from "react-icons/im";
import { BiNetworkChart } from "react-icons/bi";
import { ReactElement } from "react";
interface Props {
  modules: Array<ModuleType & { key: string }>;
  onSelect: (e: ModuleType & { key: string }) => void;
}

const icones: { [key: string]: ReactElement } = {
  Network: <BiNetworkChart />,
  Table: <ImTable2 />,
};
export const AvailableModules: React.FC<Props> = ({ modules, onSelect }) => {
  return (
    <div className="d-flex justify-content-center modules flex-column mt-4">
      {modules.map((module) => (
        <div key={module.key} className="d-flex  flex-column justify-content-center align-items-start">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id={module.key}
              checked={module.visible}
              onChange={() => onSelect(module)}
              style={{ backgroundColor: module.model.color, border: 0 }}
            />

            <label className="form-check-label" htmlFor={module.key}>
              <h4>
                <i style={{ color: module.model.color, marginRight: "0.5rem" }}>
                  {icones[module.component.name] || ""}
                </i>
                <span>{module.title}</span>
              </h4>
              <p>
                <small>{module.description}</small>
              </p>
            </label>
          </div>
        </div>
      ))}
    </div>
  );
};
