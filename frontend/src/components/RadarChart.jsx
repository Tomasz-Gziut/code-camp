import React from "react";

const FULL_W = 520;
const FULL_H = 340;
const FULL_CX = FULL_W / 2;
const FULL_CY = FULL_H / 2;
const FULL_MAX_R = 118;
const FULL_SCORE_LABEL_R = FULL_MAX_R + 20;
const MINI_W = 220;
const MINI_H = 220;
const MINI_CX = MINI_W / 2;
const MINI_CY = MINI_H / 2;
const MINI_MAX_R = 92;
const LEVELS = 4;
const DATA_VALLEY_RATIO = 0.52;

function axisAngle(i, n) {
  return (i / n) * 2 * Math.PI - Math.PI / 2;
}

function polarPt(a, r, cx, cy) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function ptStr(pts) {
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function buildPolygonPoints(angles, radius, cx, cy) {
  return angles.map((angle) => polarPt(angle, radius, cx, cy));
}

function midAngle(a, b) {
  const ax = Math.cos(a) + Math.cos(b);
  const ay = Math.sin(a) + Math.sin(b);
  return Math.atan2(ay, ax);
}

function buildStarPoints(angles, radii, valleyRatio, cx, cy) {
  return angles.flatMap((angle, i) => {
    const nextIndex = (i + 1) % angles.length;
    const nextAngle = angles[nextIndex];
    const valleyAngle = midAngle(angle, nextAngle);
    const valleyRadius = Math.min(radii[i], radii[nextIndex]) * valleyRatio;

    return [polarPt(angle, radii[i], cx, cy), polarPt(valleyAngle, valleyRadius, cx, cy)];
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

function scoreLabelPt(a, scoreLabelR, cx, cy) {
  return polarPt(a, scoreLabelR, cx, cy);
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
  accentColor = "#3b82f6",
  ariaLabel = "Radar chart of category scores",
}) {
  const n = categories.length;
  if (!n) return null;

  const isMini = variant === "mini";
  const geometry = isMini
    ? { w: MINI_W, h: MINI_H, cx: MINI_CX, cy: MINI_CY, maxR: MINI_MAX_R, scoreLabelR: MINI_MAX_R }
    : {
      w: FULL_W,
      h: FULL_H,
      cx: FULL_CX,
      cy: FULL_CY,
      maxR: FULL_MAX_R,
      scoreLabelR: FULL_SCORE_LABEL_R,
    };

  const angles = categories.map((_, i) => axisAngle(i, n));

  const gridRings = Array.from({ length: LEVELS }, (_, li) => {
    const radius = ((li + 1) / LEVELS) * geometry.maxR;
    return buildPolygonPoints(angles, radius, geometry.cx, geometry.cy);
  });

  const dataPoints = categories.map((cat, i) => {
    const r = (Math.min(Math.max(cat.score ?? 0, 0), 100) / 100) * geometry.maxR;
    return { pt: polarPt(angles[i], r, geometry.cx, geometry.cy), r };
  });
  const orderedDataPoints = buildStarPoints(
    angles,
    dataPoints.map(({ r }) => r),
    DATA_VALLEY_RATIO,
    geometry.cx,
    geometry.cy
  );
  const miniFill = accentColor;
  const miniStroke = accentColor;

  return (
    <svg
      viewBox={`0 0 ${geometry.w} ${geometry.h}`}
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
          const end = polarPt(a, geometry.maxR, geometry.cx, geometry.cy);
          return (
            <line
              key={i}
              x1={geometry.cx}
              y1={geometry.cy}
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
        fill={isMini ? miniFill : "rgba(59,130,246,0.15)"}
        stroke={isMini ? miniStroke : "#3b82f6"}
        fillOpacity={isMini ? (emphasized ? "0.24" : "0.12") : undefined}
        strokeOpacity={isMini ? (emphasized ? "0.98" : "0.72") : undefined}
        strokeWidth={isMini ? (emphasized ? "2.4" : "1.7") : "2"}
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
          const scorePt = scoreLabelPt(a, geometry.scoreLabelR, geometry.cx, geometry.cy);
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
          const sp = scoreLabelPt(a, geometry.scoreLabelR, geometry.cx, geometry.cy);
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
