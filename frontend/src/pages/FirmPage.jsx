import React from "react";
import CategoryRow from "../components/CategoryRow";
import Link from "../components/Link";
import { Badge, ScoreMeter } from "../components/ScoreBadge";
import { clampScore } from "../utils/firmUtils";

export default function FirmPage({ firm }) {
  const firmScore = clampScore(firm?.score);
  return (
    <main className="wrap">
      <header className="pageHeader">
        <Link to="/" className="backLink">
          ← Back
        </Link>
        <h1>{firm?.name ?? "Firm not found"}</h1>
        <p className="sub">Demo only. Everything on this page is mock data.</p>
      </header>

      {firm ? (
        <section className="card" aria-label="Firm details">
          <div className="firmTop">
            <div className="firmSummary">
              <div className="meta">{firm.details}</div>
            </div>
            <div className="right">
              <Badge score={firmScore} />
              <ScoreMeter score={firmScore} />
            </div>
          </div>

          <div className="divider" role="presentation" />

          <div className="panelTitle">What this score is based on (mock)</div>
          <ul className="catList" aria-label="Risk categories">
            {(firm.categories ?? []).map((c) => (
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
