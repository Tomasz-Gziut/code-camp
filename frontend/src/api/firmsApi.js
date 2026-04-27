const API = "/api";

async function requestJson(path) {
  const res = await fetch(path, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return res.json();
}

// Raw backend scores are open-ended (e.g. -65 to +33).
// Map to 0–100: 0 raw → 50, -100 raw → 0, +100 raw → 100.
function normalizeScore(raw) {
  if (raw == null) return 50;
  return Math.max(0, Math.min(100, Math.round(50 + raw / 2)));
}

function buildDetails(company, rawScore) {
  const aliases = company.aliases?.map((a) => a.name).join(", ");
  const suffix = aliases ? ` Also known as: ${aliases}.` : "";
  if (rawScore == null) return (suffix.trim() || `NIP: ${company.nip}`);
  if (rawScore > 20) return `Positive reputation signals.${suffix}`;
  if (rawScore > 0)  return `Mostly positive signals.${suffix}`;
  if (rawScore > -20) return `Mixed reputation signals.${suffix}`;
  return `Notable negative events on record.${suffix}`;
}

function buildFirm(company, scoreData, events, typeMap) {
  const rawScore = scoreData?.latest?.score ?? null;

  const countByType = {};
  for (const ev of events) {
    countByType[ev.type_id] = (countByType[ev.type_id] || 0) + 1;
  }

  // Always emit ALL event types so the radar chart has a consistent shape.
  // Types with no events get a neutral score (50) and a placeholder detail.
  const categories = Array.from(typeMap.values()).map((et) => {
    const count = countByType[et.id] ?? 0;
    return {
      id: String(et.id),
      name: et.name,
      score: count > 0 ? normalizeScore(et.score) : 50,
      detail: count > 0
        ? `${count} zdarzenie${count === 1 ? "" : count < 5 ? "a" : "ń"} tego typu.`
        : "Brak zdarzeń tego typu.",
    };
  });

  return {
    id: String(company.id),
    name: company.full_name,
    score: normalizeScore(rawScore),
    details: buildDetails(company, rawScore),
    categories,
  };
}

export async function getFirms() {
  const [companies, eventTypes] = await Promise.all([
    requestJson(`${API}/companies`),
    requestJson(`${API}/events/types`).catch(() => []),
  ]);

  const typeMap = new Map(eventTypes.map((t) => [t.id, t]));

  const scores = await Promise.all(
    companies.map((c) =>
      requestJson(`${API}/companies/${c.id}/score`).catch(() => null)
    )
  );

  return companies.map((c, i) => buildFirm(c, scores[i], [], typeMap));
}

export async function getFirmById(firmId) {
  const [company, scoreData, events, eventTypes] = await Promise.all([
    requestJson(`${API}/companies/${firmId}`),
    requestJson(`${API}/companies/${firmId}/score`).catch(() => null),
    requestJson(`${API}/companies/${firmId}/events`).catch(() => []),
    requestJson(`${API}/events/types`).catch(() => []),
  ]);

  const typeMap = new Map(eventTypes.map((t) => [t.id, t]));
  return buildFirm(company, scoreData, events, typeMap);
}
