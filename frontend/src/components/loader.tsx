import React, { FC } from "react";

export const Loader: FC<{ message?: string; className?: string; tag?: keyof JSX.IntrinsicElements }> = ({
  className,
  message = "Loading...",
  tag,
}) => {
  const Tag: keyof JSX.IntrinsicElements = tag || "h5";
  return (
    <Tag className={className}>
      <i className="fas fa-spinner fa-pulse mr-1" /> {message}
    </Tag>
  );
};
