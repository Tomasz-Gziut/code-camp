import React from "react";
import { clampScore, ratingFromScore } from "../utils/firmUtils";

export function Badge({ score }) {
  const rating = ratingFromScore(score);
  return (
    <div className={`badge ${rating.className}`} role="status" aria-label={rating.ariaLabel}>
      <span className="dot" />
      <span>{rating.label}</span>
    </div>
  );
}

export function ScoreMeter({ score, label }) {
  const s = clampScore(score);
  return (
    <div className="score" aria-label={label ?? `Score ${s} out of 100`}>
      <span>Score {s}/100</span>
      <span className="meter" role="img" aria-label="Score bar">
        <span className="meterFill" style={{ width: `${s}%` }} />
      </span>
    </div>
  );
}
