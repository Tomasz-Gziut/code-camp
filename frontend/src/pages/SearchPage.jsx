import React from "react";
import { getFirms } from "../api/firmsApi";
import Highlight from "../components/Highlight";
import Link from "../components/Link";
import RadarChart from "../components/RadarChart";
import { Badge, ScoreMeter } from "../components/ScoreBadge";
import { firmPath, normalize, scoreFirm, scoreToMeterColor } from "../utils/firmUtils";

export default function SearchPage() {
  const [firms, setFirms] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    inputRef.current?.focus?.();
  }, []);

  React.useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);
    getFirms()
      .then((items) => {
        if (!isActive) return;
        setFirms(Array.isArray(items) ? items : []);
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err);
        setFirms([]);
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
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

  const countText = isLoading ? "Loading..." : `${matches.length} match${matches.length === 1 ? "" : "es"}`;

  return (
    <main className="wrap">
      <header>
        <h1>Stellarrate</h1>
        <p className="sub">See yourself which company is the biggest star of them all.</p>
      </header>

      <section className="card" aria-label="Search">
        <div className="row">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
            <input
              ref={inputRef}
              id="query"
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="Type a firm name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="divider" role="presentation" />

        <div className="resultsHeader">
          <h2>Results</h2>
          <div className="count" aria-live="polite">
            {countText}
          </div>
        </div>

        {isLoading ? (
          <div className="empty">Loading companies...</div>
        ) : error ? (
          <div className="empty">Failed to load companies.</div>
        ) : matches.length ? (
          <ul className="list" aria-label="Firm results">
            {matches.map((firm) => (
              <li key={firm.id} className="firmLi">
                <Link to={firmPath(firm.id)} className="item itemLink" aria-label={`Open ${firm.name}`}>
                  <div className="listMiniChart" aria-hidden="true">
                    <RadarChart
                      categories={firm.scoreHistory?.[0]?.categories ?? firm.categories ?? []}
                      variant="mini"
                      emphasized
                      accentColor={scoreToMeterColor(firm.score)}
                      ariaLabel={`Latest radar chart for ${firm.name}`}
                    />
                  </div>
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
          <div className="empty">No companies found in the list.</div>
        )}

        <div className="footerNote">Remember scores are based on internet articles, they might be wrong.</div>
      </section>
    </main>
  );
}
