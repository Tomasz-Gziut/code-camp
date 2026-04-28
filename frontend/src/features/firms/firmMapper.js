import { CATEGORY_ORDER, CATEGORY_PRESENTATION } from "./categoryPresentation";

function normalizeCategoryName(name) {
  return String(name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeScore(raw) {
  if (raw == null) return 50;
  return Math.max(0, Math.min(100, Math.round(50 + raw / 2)));
}

function categoryDisplayScore(rawCategoryScore, count, intensity = 1) {
  if (count <= 0) return 50;
  const baseScore = normalizeScore(rawCategoryScore);
  return Math.round(50 + (baseScore - 50) * intensity);
}

function buildArticleLabel(article, fallbackIndex) {
  if (article?.title?.trim()) return article.title.trim();
  if (article?.url?.trim()) return article.url.trim();
  return `Artykul ${fallbackIndex + 1}`;
}

function computeSnapshotIntensity(rawScore, latestRawScore) {
  if (rawScore == null || latestRawScore == null) return 1;

  const latestDistance = Math.abs(latestRawScore);
  if (latestDistance < 0.001) {
    return rawScore === latestRawScore ? 1 : Math.min(1, Math.abs(rawScore) / 100);
  }

  return Math.max(0, Math.min(1, Math.abs(rawScore) / latestDistance));
}

function buildDetails(company, rawScore) {
  const aliases = company.aliases?.map((alias) => alias.name).join(", ");
  const suffix = aliases ? ` Also known as: ${aliases}.` : "";

  if (rawScore == null) {
    return suffix.trim() || (company.nip ? `NIP: ${company.nip}` : "Brak danych scoringowych.");
  }

  if (rawScore > 20) return `Positive reputation signals.${suffix}`;
  if (rawScore > 0) return `Mostly positive signals.${suffix}`;
  if (rawScore > -20) return `Mixed reputation signals.${suffix}`;
  return `Notable negative events on record.${suffix}`;
}

function buildFallbackPresentation(eventType) {
  return {
    displayName: eventType.name,
    emptyDetail: "Brak zdarzen tego typu.",
    eventDetail: (count) =>
      `${count} zdarzenie${count === 1 ? "" : count < 5 ? "a" : "n"} tego typu.`,
  };
}

function buildCategories(events, eventTypesById, snapshotDate, intensity = 1) {
  const countByTypeId = {};
  const sourcesByTypeId = {};
  const cutoff = snapshotDate ? Date.parse(snapshotDate) : Number.POSITIVE_INFINITY;

  for (const event of events) {
    const eventDate = Date.parse(event.date);
    if (Number.isFinite(cutoff) && Number.isFinite(eventDate) && eventDate > cutoff) {
      continue;
    }

    countByTypeId[event.type_id] = (countByTypeId[event.type_id] || 0) + 1;

    if (!event.article?.url) {
      continue;
    }

    const sources = sourcesByTypeId[event.type_id] || [];
    if (!sources.some((source) => source.url === event.article.url)) {
      sources.push({
        title: buildArticleLabel(event.article, sources.length),
        url: event.article.url,
      });
    }
    sourcesByTypeId[event.type_id] = sources;
  }

  return CATEGORY_ORDER.map((name) =>
    Array.from(eventTypesById.values()).find(
      (eventType) => normalizeCategoryName(eventType.name) === name
    )
  )
    .filter(Boolean)
    .map((eventType) => {
      const count = countByTypeId[eventType.id] ?? 0;
      const normalizedName = normalizeCategoryName(eventType.name);
      const presentation =
        CATEGORY_PRESENTATION[normalizedName] ?? buildFallbackPresentation(eventType);
      const rawCategoryScore = count > 0 ? (eventType.score ?? 0) * count : null;

      return {
        id: String(eventType.id),
        name: presentation.displayName,
        score: categoryDisplayScore(rawCategoryScore, count, intensity),
        detail: count > 0 ? presentation.eventDetail(count) : presentation.emptyDetail,
        sources: sourcesByTypeId[eventType.id] ?? [],
      };
    });
}

function buildSnapshot(company, scoreEntry, events, eventTypesById, fallbackId, latestRawScore) {
  const rawScore = scoreEntry?.score ?? null;
  const calculatedAt = scoreEntry?.calculated_at ?? null;
  const intensity = computeSnapshotIntensity(rawScore, latestRawScore);

  return {
    id: fallbackId,
    score: normalizeScore(rawScore),
    rawScore,
    calculatedAt,
    details: buildDetails(company, rawScore),
    categories: buildCategories(events, eventTypesById, calculatedAt, intensity),
  };
}

export function mapCompanyToFirm(company, scoreData, events, eventTypes) {
  const eventTypesById = new Map(eventTypes.map((eventType) => [eventType.id, eventType]));
  const latestRawScore = scoreData?.latest?.score ?? scoreData?.history?.[0]?.score ?? null;
  const scoreHistory = (scoreData?.history ?? []).map((entry, index) => ({
    ...buildSnapshot(
      company,
      entry,
      events,
      eventTypesById,
      `${company.id}-${entry.calculated_at}-${index}`,
      latestRawScore
    ),
    isLatest: index === 0,
  }));

  const activeSnapshot = scoreHistory[0] ?? {
    ...buildSnapshot(
      company,
      scoreData?.latest ?? null,
      events,
      eventTypesById,
      `${company.id}-latest-fallback`,
      latestRawScore
    ),
    isLatest: true,
  };

  return {
    id: String(company.id),
    name: company.full_name,
    score: activeSnapshot.score,
    details: activeSnapshot.details,
    categories: activeSnapshot.categories,
    scoreHistory,
  };
}
