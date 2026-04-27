import React from "react";

const CX = 190;
const CY = 150;
const MAX_R = 80;
const LABEL_R = 120;
const LEVELS = 4;
const W = 380;
const H = 300;

function axisAngle(i, n) {
  return (i / n) * 2 * Math.PI - Math.PI / 2;
}

function polarPt(a, r) {
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function ptStr(pts) {
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function textAnchor(a) {
  const x = Math.cos(a);
  if (Math.abs(x) < 0.15) return "middle";
  return x > 0 ? "start" : "end";
}

function splitName(name) {
  const words = name.split(" ");
  if (words.length <= 1) return [name, null];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

export default function RadarChart({ categories }) {
  const n = categories.length;
  if (!n) return null;

  const angles = categories.map((_, i) => axisAngle(i, n));

  const gridRings = Array.from({ length: LEVELS }, (_, li) =>
    angles.map((a) => polarPt(a, ((li + 1) / LEVELS) * MAX_R))
  );

  const dataPoints = categories.map((cat, i) => {
    const r = (Math.min(Math.max(cat.score ?? 0, 0), 100) / 100) * MAX_R;
    return { pt: polarPt(angles[i], r), r };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" aria-label="Radar chart of category scores">
      {/* Grid rings */}
      {gridRings.map((pts, li) => (
        <polygon key={li} points={ptStr(pts)} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      ))}

      {/* Axis lines */}
      {angles.map((a, i) => {
        const end = polarPt(a, MAX_R);
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={end.x.toFixed(1)}
            y2={end.y.toFixed(1)}
            stroke="#d1d5db"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={ptStr(dataPoints.map((d) => d.pt))}
        fill="rgba(59,130,246,0.15)"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Data dots */}
      {dataPoints.map(({ pt: p }, i) => (
        <circle
          key={i}
          cx={p.x.toFixed(1)}
          cy={p.y.toFixed(1)}
          r="4.5"
          fill="#3b82f6"
          stroke="#fff"
          strokeWidth="1.5"
        />
      ))}

      {/* Score values near each dot */}
      {dataPoints.map(({ r }, i) => {
        const a = angles[i];
        const nudge = Math.max(r + 13, 18);
        const sp = polarPt(a, nudge);
        return (
          <text
            key={i}
            x={sp.x.toFixed(1)}
            y={sp.y.toFixed(1)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="600"
            fill="#1d4ed8"
          >
            {categories[i].score}
          </text>
        );
      })}

      {/* Category name labels at each axis tip */}
      {categories.map((cat, i) => {
        const a = angles[i];
        const lp = polarPt(a, LABEL_R);
        const ta = textAnchor(a);
        const [l1, l2] = splitName(cat.name);
        return (
          <text key={i} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)} textAnchor={ta} fontSize="11" fill="#374151">
            {l2 ? (
              <>
                <tspan x={lp.x.toFixed(1)} dy="-0.65em">
                  {l1}
                </tspan>
                <tspan x={lp.x.toFixed(1)} dy="1.3em">
                  {l2}
                </tspan>
              </>
            ) : (
              <tspan dominantBaseline="middle">{l1}</tspan>
            )}
          </text>
        );
      })}
    </svg>
  );
}
