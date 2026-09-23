import React from "react";
import { formatStatusText } from "../../utils/formatters";

const Badge = ({ variant = "info", children, className = "" }) => {
  const variantClasses = {
    success: "badge-success",
    warning: "badge-warning",
    danger: "badge-danger",
    info: "badge-info",
    primary: "badge-primary",
    purple: "badge-purple",
    orange: "badge-orange",
  };

  const badgeClass = variantClasses[variant] || "badge-info";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${badgeClass} ${className}`}
    >
      {typeof children === "string" ? formatStatusText(children) : children}
    </span>
  );
};

export default Badge;
