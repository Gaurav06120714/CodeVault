import React from "react";
import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ size = "md", text, fullPage }: LoadingSpinnerProps) {
  const spinnerClasses = [
    styles.spinner,
    size === "sm" ? styles["size-sm"] : "",
    size === "lg" ? styles["size-lg"] : "",
  ].join(" ").trim();

  const content = (
    <div className={styles.container} style={fullPage ? { minHeight: "60vh" } : undefined}>
      <div className={spinnerClasses}></div>
      {text && <div>{text}</div>}
    </div>
  );

  return content;
}
