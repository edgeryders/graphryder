import { ModuleType } from "../../core/modules";
import { BoxWrapper } from "./../box-wrapper";

interface Props {
  modules: Array<ModuleType & { key: string }>;
  onClick: (e: ModuleType & { key: string }) => void;
}

export const AvailableModules: React.FC<Props> = ({ modules, onClick }) => {
  return (
    <div className="d-flex justify-content-center modules">
      {modules.map((module) => (
        <BoxWrapper
          key={module.key}
          bgColor={module.color}
          className="d-flex  flex-column justify-content-around align-items-center text-white add  me-1 ms-1"
        >
          <h4>{module.title}</h4>
          <p>{module.description}</p>
          <button className="btn" onClick={() => onClick(module)}>
            Add {module.title}
          </button>
        </BoxWrapper>
      ))}
    </div>
  );
};
