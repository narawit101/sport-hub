"use client";
import React from "react";

/**
 * A centralized Loading Spinner component.
 * 
 * @param {Object} props
 * @param {"full" | "inline" | "dots"} props.mode - The display mode of the spinner.
 *   - "full": Full-screen fixed overlay.
 *   - "inline": Centered spinner within its container.
 *   - "dots": Three blinking dots.
 * @returns {JSX.Element}
 */
export default function LoadingSpinner({ mode = "full" }) {
  if (mode === "inline") {
    return (
      <div className="loading-data">
        <div className="loading-data-spinner"></div>
      </div>
    );
  }

  if (mode === "dots") {
    return (
      <span className="dot-loading">
        <span className="dot">●</span>
        <span className="dot">●</span>
        <span className="dot">●</span>
      </span>
    );
  }

  return (
    <div className="load">
      <span className="spinner"></span>
    </div>
  );
}
