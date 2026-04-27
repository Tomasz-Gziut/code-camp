export function normalize(value) {
  return (value ?? "").trim().toLowerCase();
}

export function scoreFirm(firm, query) {
  const name = normalize(firm.name);
  if (!query) return 0;
  if (name === query) return 100;
  if (name.startsWith(query)) return 80;
  if (name.includes(query)) return 60;
  return -1;
}

export function clampScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

const METER_START_RGB = { r: 0x2d, g: 0x6b, b: 0xff };
const METER_END_RGB = { r: 0x2a, g: 0xf5, b: 0xc8 };

function mixChannel(start, end, ratio) {
  return Math.round(start + (end - start) * ratio);
}

function toHex(value) {
  return value.toString(16).padStart(2, "0");
}

export function scoreToMeterColor(score) {
  const ratio = clampScore(score) / 100;
  const r = mixChannel(METER_START_RGB.r, METER_END_RGB.r, ratio);
  const g = mixChannel(METER_START_RGB.g, METER_END_RGB.g, ratio);
  const b = mixChannel(METER_START_RGB.b, METER_END_RGB.b, ratio);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function ratingFromScore(score) {
  const s = clampScore(score);
  if (s >= 80) return { label: "Looks good", className: "lowRisk", ariaLabel: "Looks good" };
  if (s >= 55) return { label: "Mostly ok", className: "medRisk", ariaLabel: "Mostly ok" };
  if (s >= 30) return { label: "Needs a look", className: "highRisk", ariaLabel: "Needs a closer look" };
  return { label: "High risk", className: "vhighRisk", ariaLabel: "High risk" };
}

export function firmPath(firmId) {
  return `/${encodeURIComponent(firmId)}`;
}

export function parseFirmIdFromPathname(pathname) {
  const raw = String(pathname ?? "/");
  const trimmed = raw.length > 1 ? raw.replace(/\/+$/, "") : raw;
  if (trimmed === "/") return null;
  const segment = trimmed.slice(1);
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
