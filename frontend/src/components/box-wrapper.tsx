import React from "react";

interface Props {
  id?: string;
  className?: string;
  bgColor?: string;
  onRemove?: () => void;
}

export const BoxWrapper: React.FC<Props> = (props: React.PropsWithChildren<Props>) => {
  const { id, bgColor, className, children, onRemove } = props;
  return (
    <div
      id={id}
      style={{ backgroundColor: bgColor ? bgColor : "#FFF" }}
      className={`box-wrapper rounded p-3 shadow-sm mb-3 ${className}`}
    >
      {onRemove && <button type="button" className="btn-close" aria-label="Close" onClick={onRemove}></button>}
      {children}
    </div>
  );
};
