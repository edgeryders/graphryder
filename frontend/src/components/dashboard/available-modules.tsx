import { ModuleType } from "../../core/modules";
import { BoxWrapper } from "./../box-wrapper";

interface Props {
  modules: Array<ModuleType & { key: string }>;
  onSelect: (e: ModuleType & { key: string }) => void;
}

export const AvailableModules: React.FC<Props> = ({ modules, onSelect }) => {
  return (
    <div className="d-flex justify-content-center modules flex-column">
      {modules.map((module) => (
        <BoxWrapper
          key={module.key}
          bgColor={module.color}
          className="d-flex  flex-column justify-content-around align-items-center add"
        >
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="flexSwitchCheckDefault"
              checked={module.visible}
              onChange={() => onSelect(module)}
            />
            <label className="form-check-label" htmlFor="flexSwitchCheckDefault">
              <h4>{module.title}</h4>
            </label>
          </div>
          <p>{module.description}</p>
        </BoxWrapper>
      ))}
    </div>
  );
};
