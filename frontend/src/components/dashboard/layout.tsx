import React, { FC, ReactElement } from "react";

export const Layout: FC<{ children: ReactElement[] }> = ({ children }) => {
  return (
    <div className="modules-container">
      {children.map((child, i) => (
        <div className="module-wrapper">
          <h2>{}</h2>
          {child}
        </div>
      ))}
    </div>
  );
};
