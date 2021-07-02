import React from "react";

export const Layout: React.FC<{}> = ({ children }) => {
  return (
    <>
      <main>{children}</main>
    </>
  );
};
