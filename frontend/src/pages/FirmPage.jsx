import React from "react";
import { getFirmById } from "../api/firmsApi";
import CategoryRow from "../components/CategoryRow";
import Link from "../components/Link";
import RadarChart from "../components/RadarChart";
import { Badge, ScoreMeter } from "../components/ScoreBadge";
import { clampScore } from "../utils/firmUtils";

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
  const activeSnapshot = scoreHistory.find((entry) => entry.id === selectedSnapshotId) ?? scoreHistory[0] ?? null;
  const firmScore = clampScore(activeSnapshot?.score ?? firm?.score);
  const title = isLoading ? "Loading..." : firm?.name ?? "Firm not found";
  return (
    <main className="wrap">
      <header className="pageHeader">
        <Link to="/" className="backLink">
          ← Back
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
          <div className="chartWrap">
            <RadarChart categories={activeSnapshot?.categories ?? firm.categories ?? []} />
          </div>

          {scoreHistory.length > 1 ? (
            <div className="scoreHistory" aria-label="Historyczne daty score">
              {scoreHistory.map((entry) => {
                const isActive = entry.id === activeSnapshot?.id;
                const label = formatSnapshotDate(entry.calculatedAt);

                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={`historyChip${isActive ? " active" : ""}`}
                    onClick={() => setSelectedSnapshotId(entry.id)}
                    aria-pressed={isActive}
                  >
                    <span>{label}</span>
                    {entry.isLatest ? <span className="historyChipTag">aktualny</span> : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {activeSnapshot?.calculatedAt ? (
            <div className="chartMeta">Widok wykresu dla score z dnia {formatSnapshotDate(activeSnapshot.calculatedAt)}.</div>
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
