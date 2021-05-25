import { ModuleType } from "../../core/modules";
import { BoxWrapper } from "./../box-wrapper";

interface Props {
  modules: Array<ModuleType & { key: string }>;
  onSelect: (e: ModuleType & { key: string }) => void;
}

const icones: { [key: string]: string } = {
  Network: "fas fa-share-alt",
  Table: "fas fa-table",
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
              style={{ backgroundColor: module.model.color }}
            />

            <label className="form-check-label" htmlFor={module.key}>
              <h4>
                <i
                  className={`${icones[module.component.name] || ""}`}
                  style={{ color: module.model.color, marginRight: "0.5rem" }}
                ></i>
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
