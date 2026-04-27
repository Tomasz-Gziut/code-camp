import React from "react";

const MOCK_FIRMS = [
  {
    id: "acme",
    name: "Acme Corp",
    score: 92,
    details: "Looks consistent overall. Nothing obvious jumps out in this mock demo.",
    categories: [
      { id: "identity", name: "Identity & Registration", score: 95, detail: "Names and contact details line up in the mock records." },
      { id: "reviews", name: "Customer Reviews", score: 88, detail: "Mostly positive in the mock reviews with few repeats." },
      { id: "compliance", name: "Compliance", score: 90, detail: "No major red flags in the mock compliance checks." },
      { id: "financial", name: "Financial Signals", score: 86, detail: "Stable-looking mock signals, no sudden spikes." }
    ]
  },
  {
    id: "globex",
    name: "Globex Corporation",
    score: 41,
    details: "Some things don’t quite match up in this mock demo. Worth double-checking.",
    categories: [
      { id: "identity", name: "Identity & Registration", score: 60, detail: "A couple details are missing in the mock records." },
      { id: "reviews", name: "Customer Reviews", score: 38, detail: "Mixed mock feedback and a few recurring themes." },
      { id: "compliance", name: "Compliance", score: 44, detail: "A few minor flags show up in the mock checks." },
      { id: "financial", name: "Financial Signals", score: 32, detail: "Mock signals look a bit unstable and unclear." }
    ]
  },
  {
    id: "umbrella",
    name: "Umbrella Group",
    score: 18,
    details: "A lot of warning signs in this mock demo. If this were real, you’d pause here.",
    categories: [
      { id: "identity", name: "Identity & Registration", score: 22, detail: "Several mismatches in the mock identity checks." },
      { id: "reviews", name: "Customer Reviews", score: 14, detail: "Lots of negative mock reviews and repeat complaints." },
      { id: "compliance", name: "Compliance", score: 19, detail: "Repeated mock flags and missing pieces." },
      { id: "financial", name: "Financial Signals", score: 16, detail: "Mock activity looks irregular and risky." }
    ]
  },
  {
    id: "stark",
    name: "Stark Industries",
    score: 77,
    details: "Generally solid in this mock demo, but there are a couple items to keep an eye on.",
    categories: [
      { id: "identity", name: "Identity & Registration", score: 86, detail: "Mock identity looks good and consistent." },
      { id: "reviews", name: "Customer Reviews", score: 72, detail: "Mostly positive mock feedback with a few disputes." },
      { id: "compliance", name: "Compliance", score: 70, detail: "Some minor mock warnings, but nothing major." },
      { id: "financial", name: "Financial Signals", score: 78, detail: "Stable in the mock data, with normal swings." }
    ]
  },
  {
    id: "wayne",
    name: "Wayne Enterprises",
    score: 84,
    details: "Looks pretty trustworthy in this mock demo. Not perfect, but strong overall.",
    categories: [
      { id: "identity", name: "Identity & Registration", score: 90, detail: "Mock verification is strong and consistent." },
      { id: "reviews", name: "Customer Reviews", score: 80, detail: "Positive mock reviews and low complaint volume." },
      { id: "compliance", name: "Compliance", score: 82, detail: "Mock filings look consistent with no big issues." },
      { id: "financial", name: "Financial Signals", score: 83, detail: "Stable mock signals and low volatility." }
    ]
  },
  {
    id: "inosh",
    name: "Inosh Partners",
    score: 58,
    details: "Not enough history in this mock demo. Could be fine, but it’s a bit of a question mark.",
    categories: [
      { id: "identity", name: "Identity & Registration", score: 62, detail: "Some basic mock verification passes, but limited history." },
      { id: "reviews", name: "Customer Reviews", score: 55, detail: "Small mock sample size and mixed feedback." },
      { id: "compliance", name: "Compliance", score: 52, detail: "A few missing items in the mock compliance list." },
      { id: "financial", name: "Financial Signals", score: 63, detail: "Mock signals are okay, but early-stage patterns." }
    ]
  },
  {
    id: "northwind",
    name: "Northwind Traders",
    score: 66,
    details: "Mostly okay in this mock demo with a couple small issues that could be normal.",
    categories: [
      { id: "identity", name: "Identity & Registration", score: 70, detail: "Mostly consistent in the mock checks, a minor mismatch or two." },
      { id: "reviews", name: "Customer Reviews", score: 62, detail: "Mostly positive mock feedback with a few disputes." },
      { id: "compliance", name: "Compliance", score: 68, detail: "Some minor mock issues, but regular updates." },
      { id: "financial", name: "Financial Signals", score: 64, detail: "Moderate stability in the mock data; a bit seasonal." }
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
  if (s >= 80) return { label: "Looks good", className: "lowRisk", ariaLabel: "Looks good" };
  if (s >= 55) return { label: "Mostly ok", className: "medRisk", ariaLabel: "Mostly ok" };
  if (s >= 30) return { label: "Needs a look", className: "highRisk", ariaLabel: "Needs a closer look" };
  return { label: "High risk", className: "vhighRisk", ariaLabel: "High risk" };
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
  try {
    window.dispatchEvent(new PopStateEvent("popstate"));
  } catch {
    window.dispatchEvent(new Event("popstate"));
  }
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
        try {
          navigate(to);
        } catch {
          window.location.assign(to);
        }
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

export default function App() {
  const pathname = usePathname();
  const firmId = parseFirmIdFromPathname(pathname);

  if (!firmId) return <SearchPage firms={MOCK_FIRMS} />;

  const firm = MOCK_FIRMS.find((f) => f.id === firmId) ?? null;
  return <FirmPage firm={firm} />;
}
