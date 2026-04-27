import React from "react";

const MOCK_FIRMS = [
  {
    id: "acme",
    name: "Acme Corp",
    score: 92,
    details: "Mock signals: clean profile • long history",
    categories: [
      { id: "identity", name: "Identity & Registration", score: 95, detail: "Mock: matching records • verified contacts" },
      { id: "reviews", name: "Customer Reviews", score: 88, detail: "Mock: mostly positive • low dispute rate" },
      { id: "compliance", name: "Compliance", score: 90, detail: "Mock: no major flags • consistent filings" },
      { id: "financial", name: "Financial Signals", score: 86, detail: "Mock: stable indicators • low volatility" }
    ]
  },
  {
    id: "globex",
    name: "Globex Corporation",
    score: 41,
    details: "Mock signals: mixed reviews • limited info",
    categories: [
      { id: "identity", name: "Identity & Registration", score: 60, detail: "Mock: partial match • missing documents" },
      { id: "reviews", name: "Customer Reviews", score: 38, detail: "Mock: mixed feedback • recurring complaints" },
      { id: "compliance", name: "Compliance", score: 44, detail: "Mock: inconsistent filings • minor flags" },
      { id: "financial", name: "Financial Signals", score: 32, detail: "Mock: volatility • unclear ownership" }
    ]
  },
  {
    id: "umbrella",
    name: "Umbrella Group",
    score: 18,
    details: "Mock signals: multiple complaints • mismatched records",
    categories: [
      { id: "identity", name: "Identity & Registration", score: 22, detail: "Mock: mismatched records • suspicious domains" },
      { id: "reviews", name: "Customer Reviews", score: 14, detail: "Mock: many complaints • chargeback mentions" },
      { id: "compliance", name: "Compliance", score: 19, detail: "Mock: repeated flags • missing disclosures" },
      { id: "financial", name: "Financial Signals", score: 16, detail: "Mock: high risk patterns • irregular activity" }
    ]
  },
  {
    id: "stark",
    name: "Stark Industries",
    score: 77,
    details: "Mock signals: verified contacts • some warnings",
    categories: [
      { id: "identity", name: "Identity & Registration", score: 86, detail: "Mock: verified entity • clear ownership" },
      { id: "reviews", name: "Customer Reviews", score: 72, detail: "Mock: good feedback • some disputes" },
      { id: "compliance", name: "Compliance", score: 70, detail: "Mock: minor warnings • mostly consistent" },
      { id: "financial", name: "Financial Signals", score: 78, detail: "Mock: stable • moderate volatility" }
    ]
  },
  {
    id: "wayne",
    name: "Wayne Enterprises",
    score: 84,
    details: "Mock signals: verified identity • stable operations",
    categories: [
      { id: "identity", name: "Identity & Registration", score: 90, detail: "Mock: verified • strong documentation" },
      { id: "reviews", name: "Customer Reviews", score: 80, detail: "Mock: positive • low complaint volume" },
      { id: "compliance", name: "Compliance", score: 82, detail: "Mock: consistent filings • no major flags" },
      { id: "financial", name: "Financial Signals", score: 83, detail: "Mock: stable • low risk indicators" }
    ]
  },
  {
    id: "inosh",
    name: "Inosh Partners",
    score: 58,
    details: "Mock signals: new firm • partial verification",
    categories: [
      { id: "identity", name: "Identity & Registration", score: 62, detail: "Mock: verified email • limited history" },
      { id: "reviews", name: "Customer Reviews", score: 55, detail: "Mock: small sample size • mixed" },
      { id: "compliance", name: "Compliance", score: 52, detail: "Mock: incomplete filings • no major flags" },
      { id: "financial", name: "Financial Signals", score: 63, detail: "Mock: stable • early-stage patterns" }
    ]
  },
  {
    id: "northwind",
    name: "Northwind Traders",
    score: 66,
    details: "Mock signals: consistent filings • minor issues",
    categories: [
      { id: "identity", name: "Identity & Registration", score: 70, detail: "Mock: consistent • minor mismatches" },
      { id: "reviews", name: "Customer Reviews", score: 62, detail: "Mock: mostly positive • a few disputes" },
      { id: "compliance", name: "Compliance", score: 68, detail: "Mock: minor issues • regular updates" },
      { id: "financial", name: "Financial Signals", score: 64, detail: "Mock: moderate stability • seasonal swings" }
    ]
  }
];

function normalize(value) {
  return (value ?? "").trim().toLowerCase();
}

function scoreFirm(firm, query) {
  const name = normalize(firm.name);
  if (!query) return 0;
  if (name === query) return 100;
  if (name.startsWith(query)) return 80;
  if (name.includes(query)) return 60;
  return -1;
}

function clampScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function ratingFromScore(score) {
  const s = clampScore(score);
  if (s >= 80) return { label: "LOW RISK", className: "lowRisk", ariaLabel: "Low risk" };
  if (s >= 55) return { label: "MEDIUM RISK", className: "medRisk", ariaLabel: "Medium risk" };
  if (s >= 30) return { label: "HIGH RISK", className: "highRisk", ariaLabel: "High risk" };
  return { label: "VERY HIGH RISK", className: "vhighRisk", ariaLabel: "Very high risk" };
}

function Highlight({ text, query }) {
  const q = normalize(query);
  const t = String(text);
  if (!q) return t;
  const lower = t.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return t;

  const before = t.slice(0, idx);
  const mid = t.slice(idx, idx + q.length);
  const after = t.slice(idx + q.length);

  return (
    <>
      {before}
      <mark>{mid}</mark>
      {after}
    </>
  );
}

function Badge({ score }) {
  const rating = ratingFromScore(score);
  return (
    <div className={`badge ${rating.className}`} role="status" aria-label={rating.ariaLabel}>
      <span className="dot" />
      <span>{rating.label}</span>
    </div>
  );
}

function ScoreMeter({ score, label }) {
  const s = clampScore(score);
  return (
    <div className="score" aria-label={label ?? `Score ${s} out of 100`}>
      <span>Score {s}/100</span>
      <span className="meter" role="img" aria-label="Score bar">
        <span className="meterFill" style={{ width: `${s}%` }} />
      </span>
    </div>
  );
}

function CategoryRow({ category }) {
  return (
    <li className="catRow">
      <div className="catLeft">
        <div className="catName">{category.name}</div>
        <div className="catDetail">{category.detail}</div>
      </div>
      <div className="catRight">
        <Badge score={category.score} />
        <ScoreMeter score={category.score} label={`${category.name} score ${clampScore(category.score)} out of 100`} />
      </div>
    </li>
  );
}

function firmPath(firmId) {
  return `/${encodeURIComponent(firmId)}`;
}

function parseFirmIdFromPathname(pathname) {
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

function usePathname() {
  const [pathname, setPathname] = React.useState(() => window.location.pathname);
  React.useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  return pathname;
}

function navigate(to) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function Link({ to, className, children, ...rest }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

function SearchPage({ firms }) {
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
        <p className="sub">Mockup only. This does not use real data and should not be used for real decisions.</p>
      </header>

      <section className="card" aria-label="Search">
        <div className="row">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
            <label htmlFor="query">Search for a firm</label>
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

function FirmPage({ firm }) {
  const firmScore = clampScore(firm?.score);
  return (
    <main className="wrap">
      <header className="pageHeader">
        <Link to="/" className="backLink">
          ← Back
        </Link>
        <h1>{firm?.name ?? "Firm not found"}</h1>
        <p className="sub">Mockup only. This does not use real data and should not be used for real decisions.</p>
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

          <div className="panelTitle">Categories</div>
          <ul className="catList" aria-label="Risk categories">
            {(firm.categories ?? []).map((c) => (
              <CategoryRow key={c.id} category={c} />
            ))}
          </ul>

          <div className="footerNote">Risk labels and scores are mock values for UI demo only.</div>
        </section>
      ) : (
        <section className="card" aria-label="Not found">
          <div className="empty">Firm not found in the mock list.</div>
        </section>
      )}
    </main>
  );
}

export default function App() {
  const pathname = usePathname();
  const firmId = parseFirmIdFromPathname(pathname);

  if (!firmId) return <SearchPage firms={MOCK_FIRMS} />;

  const firm = MOCK_FIRMS.find((f) => f.id === firmId) ?? null;
  return <FirmPage firm={firm} />;
}
