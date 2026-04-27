import React from "react";
import { clampScore } from "../utils/firmUtils";
import { Badge, ScoreMeter } from "./ScoreBadge";

export default function CategoryRow({ category }) {
  return (
    <li className="catRow">
      <div className="catLeft">
        <div className="catName">{category.name}</div>
        <div className="catDetail">{category.detail}</div>
      </div>
      <div className="catRight">
        <Badge score={category.score} />
        <ScoreMeter score={category.score} label={`${category.name} score ${clampScore(category.score)} out of 100`} />
      </div>
    </li>
  );
}
