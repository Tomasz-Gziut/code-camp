import React from "react";

const W = 520;
const H = 340;
const CX = W / 2;
const CY = H / 2;
const MAX_R = 118;
const SCORE_LABEL_R = MAX_R + 20;
const LEVELS = 4;
const DATA_VALLEY_RATIO = 0.52;

function axisAngle(i, n) {
  return (i / n) * 2 * Math.PI - Math.PI / 2;
}

function polarPt(a, r) {
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function ptStr(pts) {
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function buildPolygonPoints(angles, radius) {
  return angles.map((angle) => polarPt(angle, radius));
}

function midAngle(a, b) {
  const ax = Math.cos(a) + Math.cos(b);
  const ay = Math.sin(a) + Math.sin(b);
  return Math.atan2(ay, ax);
}

function buildStarPoints(angles, radii, valleyRatio) {
  return angles.flatMap((angle, i) => {
    const nextIndex = (i + 1) % angles.length;
    const nextAngle = angles[nextIndex];
    const valleyAngle = midAngle(angle, nextAngle);
    const valleyRadius = Math.min(radii[i], radii[nextIndex]) * valleyRatio;

    return [polarPt(angle, radii[i]), polarPt(valleyAngle, valleyRadius)];
  });
}

function textAnchor(a) {
  const x = Math.cos(a);
  if (Math.abs(x) < 0.15) return "middle";
  return x > 0 ? "start" : "end";
}

function dominantBaseline(a) {
  const y = Math.sin(a);
  if (Math.abs(y) < 0.15) return "middle";
  return y > 0 ? "hanging" : "auto";
}

function scoreLabelPt(a) {
  return polarPt(a, SCORE_LABEL_R);
}

function splitName(name) {
  const words = name.split(" ");
  if (words.length <= 1) return [name, null];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function labelLayout(a) {
  const x = Math.cos(a);
  const y = Math.sin(a);

  if (Math.abs(x) < 0.2) {
    return {
      textAnchor: "middle",
      xOffset: 0,
      yOffset: y < 0 ? -18 : 18,
      lineGap: 12,
    };
  }

  return {
    textAnchor: x > 0 ? "start" : "end",
    xOffset: x > 0 ? 20 : -20,
    yOffset: y < 0 ? -8 : 8,
    lineGap: 14,
  };
}

function labelLineY(baseY, layout, lineIndex, lineCount) {
  if (lineCount === 1) {
    return baseY;
  }

  if (layout.textAnchor === "middle") {
    return baseY + (lineIndex === 0 ? -6 : 6);
  }

  return baseY + (lineIndex - (lineCount - 1) / 2) * layout.lineGap;
}

export default function RadarChart({
  categories,
  variant = "full",
  emphasized = false,
  ariaLabel = "Radar chart of category scores",
}) {
  const n = categories.length;
  if (!n) return null;

  const isMini = variant === "mini";

  const angles = categories.map((_, i) => axisAngle(i, n));

  const gridRings = Array.from({ length: LEVELS }, (_, li) => {
    const radius = ((li + 1) / LEVELS) * MAX_R;
    return buildPolygonPoints(angles, radius);
  });

  const dataPoints = categories.map((cat, i) => {
    const r = (Math.min(Math.max(cat.score ?? 0, 0), 100) / 100) * MAX_R;
    return { pt: polarPt(angles[i], r), r };
  });
  const orderedDataPoints = buildStarPoints(
    angles,
    dataPoints.map(({ r }) => r),
    DATA_VALLEY_RATIO
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="auto"
      aria-label={ariaLabel}
      style={{ display: "block", overflow: "visible" }}
    >
      {!isMini
        ? gridRings.map((pts, li) => (
          <polygon
            key={li}
            points={ptStr(pts)}
            fill="none"
            stroke="color-mix(in oklab, var(--text) 18%, transparent)"
            strokeWidth="1.5"
          />
        ))
        : null}

      {!isMini
        ? angles.map((a, i) => {
          const end = polarPt(a, MAX_R);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={end.x.toFixed(1)}
              y2={end.y.toFixed(1)}
              stroke="color-mix(in oklab, var(--text) 16%, transparent)"
              strokeWidth="1"
            />
          );
        })
        : null}

      <polygon
        points={ptStr(orderedDataPoints)}
        fill={isMini
          ? emphasized
            ? "color-mix(in oklab, var(--purple2) 34%, transparent)"
            : "color-mix(in oklab, var(--text) 12%, transparent)"
          : "rgba(59,130,246,0.15)"}
        stroke={isMini
          ? emphasized
            ? "color-mix(in oklab, var(--purple) 88%, white)"
            : "color-mix(in oklab, var(--text) 34%, transparent)"
          : "#3b82f6"}
        strokeWidth={isMini ? (emphasized ? "2.4" : "1.6") : "2"}
        strokeLinejoin="round"
      />

      {!isMini
        ? dataPoints.map(({ pt: p }, i) => (
          <circle
            key={i}
            cx={p.x.toFixed(1)}
            cy={p.y.toFixed(1)}
            r="4.5"
            fill="#3b82f6"
            stroke="#fff"
            strokeWidth="1.5"
          />
        ))
        : null}

      {!isMini
        ? categories.map((cat, i) => {
          const a = angles[i];
          const scorePt = scoreLabelPt(a);
          const layout = labelLayout(a);
          const labelX = scorePt.x + layout.xOffset;
          const labelY = scorePt.y + layout.yOffset;
          const lines = splitName(cat.name).filter(Boolean);
          return (
            <text
              key={i}
              x={labelX.toFixed(1)}
              y={labelY.toFixed(1)}
              textAnchor={layout.textAnchor}
              fontSize="12"
              fill="var(--muted)"
            >
              {lines.map((line, lineIndex) => (
                <tspan
                  key={`${cat.id ?? i}-${lineIndex}`}
                  x={labelX.toFixed(1)}
                  y={labelLineY(labelY, layout, lineIndex, lines.length).toFixed(1)}
                >
                  {line}
                </tspan>
              ))}
            </text>
          );
        })
        : null}

      {!isMini
        ? categories.map((cat, i) => {
          const a = angles[i];
          const sp = scoreLabelPt(a);
          return (
            <text
              key={cat.id ?? i}
              x={sp.x.toFixed(1)}
              y={sp.y.toFixed(1)}
              textAnchor={textAnchor(a)}
              dominantBaseline={dominantBaseline(a)}
              fontSize="12"
              fontWeight="700"
              fill="#1d4ed8"
            >
              {cat.score}
            </text>
          );
        })
        : null}
    </svg>
  );
}
