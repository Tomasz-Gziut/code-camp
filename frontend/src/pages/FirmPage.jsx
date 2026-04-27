import React from "react";
import { getFirmById } from "../api/firmsApi";
import CategoryRow from "../components/CategoryRow";
import Link from "../components/Link";
import RadarChart from "../components/RadarChart";
import { Badge, ScoreMeter } from "../components/ScoreBadge";
import { clampScore } from "../utils/firmUtils";

function ChevronIcon({ direction = "left" }) {
  const isLeft = direction === "left";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={isLeft ? "M14.5 5.5L8 12l6.5 6.5" : "M9.5 5.5L16 12l-6.5 6.5"} />
    </svg>
  );
}

function formatSnapshotDate(value) {
  if (!value) return "Unknown date";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export default function FirmPage({ firmId }) {
  const [firm, setFirm] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedSnapshotId, setSelectedSnapshotId] = React.useState(null);

  React.useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);
    setFirm(null);
    setSelectedSnapshotId(null);

    getFirmById(firmId)
      .then((data) => {
        if (!isActive) return;
        setFirm(data ?? null);
      })
      .catch((err) => {
        if (!isActive) return;
        if (err?.status === 404) {
          setFirm(null);
          return;
        }
        setError(err);
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [firmId]);

  const scoreHistory = firm?.scoreHistory ?? [];
  const activeSnapshot =
    scoreHistory.find((entry) => entry.id === selectedSnapshotId) ?? scoreHistory[0] ?? null;
  const activeSnapshotIndex = scoreHistory.findIndex((entry) => entry.id === activeSnapshot?.id);
  const firmScore = clampScore(activeSnapshot?.score ?? firm?.score);
  const title = isLoading ? "Loading..." : firm?.name ?? "Firm not found";

  function selectSnapshotByIndex(index) {
    const nextSnapshot = scoreHistory[index];
    if (!nextSnapshot) return;
    setSelectedSnapshotId(nextSnapshot.id);
  }

  return (
    <main className="wrap">
      <header className="pageHeader">
        <Link to="/" className="backLink">
          Back
        </Link>
        <h1>{title}</h1>
        <p className="sub">Demo only. Everything on this page is mock data.</p>
      </header>

      {isLoading ? (
        <section className="card" aria-label="Loading">
          <div className="empty">Loading firm...</div>
        </section>
      ) : error ? (
        <section className="card" aria-label="Error">
          <div className="empty">Failed to load firm.</div>
        </section>
      ) : firm ? (
        <section className="card" aria-label="Firm details">
          <div className="firmTop">
            <div className="firmSummary">
              <div className="meta">{activeSnapshot?.details ?? firm.details}</div>
            </div>
            <div className="right">
              <Badge score={firmScore} />
              <ScoreMeter score={firmScore} />
            </div>
          </div>

          <div className="divider" role="presentation" />

          <div className="panelTitle">Score breakdown</div>
          {activeSnapshot?.calculatedAt ? (
            <div className="chartDateNav" aria-label="Nawigacja po datach score">
              <button
                type="button"
                className="chartNavArrow"
                onClick={() => selectSnapshotByIndex(activeSnapshotIndex - 1)}
                disabled={activeSnapshotIndex <= 0}
                aria-label="Pokaz poprzedni score"
              >
                <ChevronIcon direction="left" />
              </button>
              <div className="chartDateLabel">{formatSnapshotDate(activeSnapshot.calculatedAt)}</div>
              <button
                type="button"
                className="chartNavArrow"
                onClick={() => selectSnapshotByIndex(activeSnapshotIndex + 1)}
                disabled={activeSnapshotIndex >= scoreHistory.length - 1}
                aria-label="Pokaz nastepny score"
              >
                <ChevronIcon direction="right" />
              </button>
            </div>
          ) : null}

          <div className="chartWrap">
            <RadarChart
              categories={activeSnapshot?.categories ?? firm.categories ?? []}
              ariaLabel={`Radar chart for ${formatSnapshotDate(activeSnapshot?.calculatedAt)}`}
            />
          </div>

          {scoreHistory.length > 1 ? (
            <div className="snapshotGallery" aria-label="Historia wykresow">
              {scoreHistory.map((entry) => {
                const isActive = entry.id === activeSnapshot?.id;

                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={`snapshotMiniButton${isActive ? " active" : ""}`}
                    onClick={() => setSelectedSnapshotId(entry.id)}
                    aria-pressed={isActive}
                    aria-label={`Pokaz score z dnia ${formatSnapshotDate(entry.calculatedAt)}`}
                    title={formatSnapshotDate(entry.calculatedAt)}
                  >
                    <div className="snapshotMini">
                      <RadarChart
                        categories={entry.categories ?? []}
                        variant="mini"
                        emphasized={isActive}
                        ariaLabel={`Miniatura wykresu z dnia ${formatSnapshotDate(entry.calculatedAt)}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="divider" role="presentation" />

          <div className="panelTitle">What this score is based on (mock)</div>
          <ul className="catList" aria-label="Risk categories">
            {(activeSnapshot?.categories ?? firm.categories ?? []).map((c) => (
              <CategoryRow key={c.id} category={c} />
            ))}
          </ul>

          <div className="footerNote">In a real app, these categories would come from real checks and sources.</div>
        </section>
      ) : (
        <section className="card" aria-label="Not found">
          <div className="empty">Firm not found in the mock list.</div>
        </section>
      )}
    </main>
  );
}
