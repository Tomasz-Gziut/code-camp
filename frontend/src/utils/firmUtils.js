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
