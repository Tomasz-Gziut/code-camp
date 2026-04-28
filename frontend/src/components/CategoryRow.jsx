import React from "react";
import { clampScore } from "../utils/firmUtils";
import { Badge, ScoreMeter, Tag } from "./ScoreBadge";

export default function CategoryRow({ category }) {
  const sources = category.sources ?? [];

  return (
    <li className="catRow">
      <div className="catLeft">
        <div className="catName">
          <Tag score={category.score}>{category.name}</Tag>
        </div>
        <div className="catDetail">{category.detail}</div>
        {sources.length > 0 ? (
          <details className="catSources">
            <summary>
              Related articles ({sources.length})
            </summary>
            <div className="catSourcesList">
              {sources.map((source) => (
                <a
                  key={source.url}
                  className="catSourceLink"
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.title}
                </a>
              ))}
            </div>
          </details>
        ) : null}
      </div>
      <div className="catRight">
        <Badge score={category.score} />
        <ScoreMeter score={category.score} label={`${category.name} score ${clampScore(category.score)} out of 100`} />
      </div>
    </li>
  );
}
