import React from "react";
import { clampScore, ratingFromScore, scoreToMeterColor } from "../utils/firmUtils";

function toneStyle(score) {
  const tone = scoreToMeterColor(score);
  return { "--score-tone": tone };
}

export function Badge({ score }) {
  const rating = ratingFromScore(score);
  return (
    <div
      className="badge scoreTone"
      style={toneStyle(score)}
      role="status"
      aria-label={rating.ariaLabel}
    >
      <span className="dot" />
      <span>{rating.label}</span>
    </div>
  );
}

export function Tag({ score, children, className = "" }) {
  const classes = ["tag", "scoreTone", className].filter(Boolean).join(" ");

  return (
    <span className={classes} style={toneStyle(score)}>
      {children}
    </span>
  );
}

export function ScoreMeter({ score, label }) {
  const s = clampScore(score);
  return (
    <div className="score" aria-label={label ?? `Score ${s} out of 100`}>
      <span>Score {s}/100</span>
      <span className="meter" role="img" aria-label="Score bar">
        <span className="meterFill" style={{ "--fill-percent": `${s}%` }} />
      </span>
    </div>
  );
}
