import React from "react";
import Highlight from "../components/Highlight";
import Link from "../components/Link";
import { Badge, ScoreMeter } from "../components/ScoreBadge";
import { firmPath, normalize, scoreFirm } from "../utils/firmUtils";

export default function SearchPage({ firms }) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    inputRef.current?.focus?.();
  }, []);

  const matches = React.useMemo(() => {
    const q = normalize(query);
    if (!q) return firms.slice(0, 6);
    return firms
      .map((firm) => ({ firm, score: scoreFirm(firm, q) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score || a.firm.name.localeCompare(b.firm.name))
      .map((x) => x.firm);
  }, [query, firms]);

  const countText = `${matches.length} match${matches.length === 1 ? "" : "es"}`;

  return (
    <main className="wrap">
      <header>
        <h1>Firm Safety Checker</h1>
        <p className="sub">Demo only. These scores are made up and not real safety advice.</p>
      </header>

      <section className="card" aria-label="Search">
        <div className="row">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
            <label htmlFor="query">Search a firm</label>
            <input
              ref={inputRef}
              id="query"
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="Type a firm name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="hint">Try: Acme, Globex, Umbrella, Stark, Wayne</div>
          </div>
        </div>

        <div className="divider" role="presentation" />

        <div className="resultsHeader">
          <h2>Results</h2>
          <div className="count" aria-live="polite">
            {countText}
          </div>
        </div>

        {matches.length ? (
          <ul className="list" aria-label="Firm results">
            {matches.map((firm) => (
              <li key={firm.id} className="firmLi">
                <Link to={firmPath(firm.id)} className="item itemLink" aria-label={`Open ${firm.name}`}>
                  <div className="left">
                    <div className="name">
                      <Highlight text={firm.name} query={query} />
                    </div>
                    <div className="meta">{firm.details}</div>
                  </div>
                  <div className="right">
                    <Badge score={firm.score} />
                    <ScoreMeter score={firm.score} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">No firms found in the mock list.</div>
        )}

        <div className="footerNote">Risk labels and scores are mock values for UI demo only.</div>
      </section>
    </main>
  );
}
