import React, { useState } from "react";
import { BiFullscreen, BiExitFullscreen } from "react-icons/bi";
import { AiOutlineClose } from "react-icons/ai";
interface Props {
  id?: string;
  className?: string;
  bgColor?: string;
  onRemove?: () => void;
}

export const BoxWrapper: React.FC<Props> = (props: React.PropsWithChildren<Props>) => {
  const { id, bgColor, className, children, onRemove } = props;
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  return (
    <div
      id={id}
      style={{ backgroundColor: bgColor ? bgColor : "#FFF" }}
      className={`box-wrapper rounded shadow-sm mb-3 ${className} ${fullscreen ? "fullscreen" : ""}`}
    >
      <div className="box-actions">
        <button
          type="button"
          className="btn btn-fullscreen"
          aria-label="Fullscreen"
          onClick={() => setFullscreen(!fullscreen)}
        >
          <i>{fullscreen ? <BiExitFullscreen /> : <BiFullscreen />}</i>
        </button>
        {onRemove && !fullscreen && (
          <button type="button" className="btn" aria-label="Close" onClick={onRemove}>
            <i>
              <AiOutlineClose />
            </i>
          </button>
        )}
      </div>
      {children}
    </div>
  );
};
