import React from "react";
import "./Badge.css";

export default function Badge({ text, variant = "info", className = "" }) {
  const badgeClasses = ["badge", `badge-${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return <span className={badgeClasses}>{text}</span>;
}
