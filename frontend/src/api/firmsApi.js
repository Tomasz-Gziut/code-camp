const API = "/api";
const CATEGORY_ORDER = [
  "naruszenie danych",
  "partnerstwa i wzrost",
  "postepowania prawne",
  "nagrody i reputacja",
  "nadzor regulacyjny",
];

const CATEGORY_PRESENTATION = {
  "naruszenie danych": {
    displayName: "Bezpieczenstwo danych",
    emptyDetail: "Brak negatywnych zdarzen w tym obszarze.",
    eventDetail: (count) => `${count} negatywne zdarzenie${count === 1 ? "" : count < 5 ? "a" : "n"} w tym obszarze.`,
  },
  "partnerstwa i wzrost": {
    displayName: "Partnerstwa i wzrost",
    emptyDetail: "Brak pozytywnych zdarzen tego typu.",
    eventDetail: (count) => `${count} pozytywne zdarzenie${count === 1 ? "" : count < 5 ? "a" : "n"} tego typu.`,
  },
  "postepowania prawne": {
    displayName: "Stabilnosc prawna",
    emptyDetail: "Brak negatywnych zdarzen prawnych.",
    eventDetail: (count) => `${count} negatywne zdarzenie${count === 1 ? "" : count < 5 ? "a" : "n"} prawne.`,
  },
  "nagrody i reputacja": {
    displayName: "Nagrody i reputacja",
    emptyDetail: "Brak pozytywnych zdarzen tego typu.",
    eventDetail: (count) => `${count} pozytywne zdarzenie${count === 1 ? "" : count < 5 ? "a" : "n"} tego typu.`,
  },
  "nadzor regulacyjny": {
    displayName: "Zgodnosc regulacyjna",
    emptyDetail: "Brak negatywnych sygnalow regulacyjnych.",
    eventDetail: (count) => `${count} negatywne zdarzenie${count === 1 ? "" : count < 5 ? "a" : "n"} regulacyjne.`,
  },
};

function normalizeCategoryName(name) {
  return String(name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

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
// Map to 0-100: 0 raw -> 50, -100 raw -> 0, +100 raw -> 100.
function normalizeScore(raw) {
  if (raw == null) return 50;
  return Math.max(0, Math.min(100, Math.round(50 + raw / 2)));
}

function categoryDisplayScore(rawCategoryScore, categoryScore, count) {
  if (count <= 0) {
    return categoryScore < 0 ? 100 : 50;
  }

  if (categoryScore < 0) {
    return Math.max(0, Math.min(100, Math.round(100 + rawCategoryScore)));
  }

  return normalizeScore(rawCategoryScore);
}

function buildDetails(company, rawScore) {
  const aliases = company.aliases?.map((a) => a.name).join(", ");
  const suffix = aliases ? ` Also known as: ${aliases}.` : "";
  if (rawScore == null) return suffix.trim() || (company.nip ? `NIP: ${company.nip}` : "Brak danych scoringowych.");
  if (rawScore > 20) return `Positive reputation signals.${suffix}`;
  if (rawScore > 0) return `Mostly positive signals.${suffix}`;
  if (rawScore > -20) return `Mixed reputation signals.${suffix}`;
  return `Notable negative events on record.${suffix}`;
}

function buildSnapshot(company, scoreEntry, events, typeMap, fallbackId) {
  const rawScore = scoreEntry?.score ?? null;
  const calculatedAt = scoreEntry?.calculated_at ?? null;

  return {
    id: fallbackId,
    score: normalizeScore(rawScore),
    rawScore,
    calculatedAt,
    details: buildDetails(company, rawScore),
    categories: buildCategories(events, typeMap, calculatedAt),
  };
}

function buildCategories(events, typeMap, snapshotDate) {
  const countByType = {};
  const cutoff = snapshotDate ? Date.parse(snapshotDate) : Number.POSITIVE_INFINITY;

  for (const ev of events) {
    const eventDate = Date.parse(ev.date);
    if (Number.isFinite(cutoff) && Number.isFinite(eventDate) && eventDate > cutoff) {
      continue;
    }

    countByType[ev.type_id] = (countByType[ev.type_id] || 0) + 1;
  }

  // Only render the canonical 5 categories so stale DB rows cannot reintroduce a 6th axis.
  return CATEGORY_ORDER.map((name) =>
    Array.from(typeMap.values()).find((et) => normalizeCategoryName(et.name) === name)
  )
    .filter(Boolean)
    .map((et) => {
      const count = countByType[et.id] ?? 0;
      const normalizedName = normalizeCategoryName(et.name);
      const presentation = CATEGORY_PRESENTATION[normalizedName] ?? {
        displayName: et.name,
        emptyDetail: "Brak zdarzen tego typu.",
        eventDetail: (eventCount) =>
          `${eventCount} zdarzenie${eventCount === 1 ? "" : eventCount < 5 ? "a" : "n"} tego typu.`,
      };
      const rawCategoryScore = count > 0 ? (et.score ?? 0) * count : null;
      return {
        id: String(et.id),
        name: presentation.displayName,
        score: categoryDisplayScore(rawCategoryScore, et.score ?? 0, count),
        detail: count > 0 ? presentation.eventDetail(count) : presentation.emptyDetail,
      };
    });
}

function buildFirm(company, scoreData, events, typeMap) {
  const history = (scoreData?.history ?? []).map((entry, index) => ({
    ...buildSnapshot(company, entry, events, typeMap, `${company.id}-${entry.calculated_at}-${index}`),
    isLatest: index === 0,
  }));

  const activeSnapshot = history[0] ?? {
    ...buildSnapshot(company, scoreData?.latest ?? null, events, typeMap, `${company.id}-latest-fallback`),
    isLatest: true,
  };

  return {
    id: String(company.id),
    name: company.full_name,
    score: activeSnapshot.score,
    details: activeSnapshot.details,
    categories: activeSnapshot.categories,
    scoreHistory: history,
  };
}

export async function getFirms() {
  const [companies, eventTypes] = await Promise.all([
    requestJson(`${API}/companies`),
    requestJson(`${API}/events/types`).catch(() => []),
  ]);

  const typeMap = new Map(eventTypes.map((t) => [t.id, t]));

  const [scores, eventsByCompany] = await Promise.all([
    Promise.all(
      companies.map((c) =>
        requestJson(`${API}/companies/${c.id}/score`).catch(() => null)
      )
    ),
    Promise.all(
      companies.map((c) =>
        requestJson(`${API}/companies/${c.id}/events`).catch(() => [])
      )
    ),
  ]);

  return companies.map((c, i) => buildFirm(c, scores[i], eventsByCompany[i], typeMap));
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
