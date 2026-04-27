import React from "react";

const API = "/api";

// ─── Score helpers ────────────────────────────────────────────────────────────

// Raw backend scores are open-ended (e.g. -65 to +33).
// Map them to 0–100 for display: 0 raw → 50, -100 raw → 0, +100 raw → 100.
function normalizeScore(raw) {
  if (raw == null) return 50;
  return Math.max(0, Math.min(100, Math.round(50 + raw / 2)));
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

// ─── Data mapping ─────────────────────────────────────────────────────────────

function detailText(company, rawScore) {
  const aliases = company.aliases?.map((a) => a.name).join(", ");
  const suffix = aliases ? ` Also known as: ${aliases}.` : "";
  if (rawScore == null) return suffix.trim() || `NIP: ${company.nip}`;
  if (rawScore > 20) return `Positive reputation signals.${suffix}`;
  if (rawScore > 0) return `Mostly positive signals.${suffix}`;
  if (rawScore > -20) return `Mixed reputation signals.${suffix}`;
  return `Notable negative events on record.${suffix}`;
}

function mapToFirm(company, scoreData) {
  const rawScore = scoreData?.latest?.score ?? null;
  return {
    id: String(company.id),
    name: company.full_name,
    score: normalizeScore(rawScore),
    details: detailText(company, rawScore),
    categories: [],
  };
}

function mapToFirmDetail(company, scoreData, events, eventTypes) {
  const rawScore = scoreData?.latest?.score ?? null;

  const typeMap = new Map(eventTypes.map((t) => [t.id, t]));
  const countByType = {};
  for (const ev of events) {
    countByType[ev.type_id] = (countByType[ev.type_id] || 0) + 1;
  }

  const categories = Object.entries(countByType).map(([typeId, count]) => {
    const et = typeMap.get(Number(typeId));
    return {
      id: String(typeId),
      name: et?.name ?? `Event type ${typeId}`,
      score: et != null ? normalizeScore(et.score) : 50,
      detail: `${count} event${count === 1 ? "" : "s"} of this type on record.`,
    };
  });

  return {
    id: String(company.id),
    name: company.full_name,
    score: normalizeScore(rawScore),
    details: detailText(company, rawScore),
    categories,
  };
}

// ─── Data hooks ───────────────────────────────────────────────────────────────

function useCompanies() {
  const [firms, setFirms] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API}/companies`);
        if (!res.ok) throw new Error(`Failed to load companies (${res.status})`);
        const companies = await res.json();

        const scores = await Promise.all(
          companies.map((c) =>
            fetch(`${API}/companies/${c.id}/score`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        );

        if (!cancelled) setFirms(companies.map((c, i) => mapToFirm(c, scores[i])));
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { firms, error };
}

function useCompanyDetail(firmId) {
  const [firm, setFirm] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!firmId) return;
    let cancelled = false;
    setFirm(null);
    setError(null);

    async function load() {
      try {
        const [companyRes, scoreRes, eventsRes, typesRes] = await Promise.all([
          fetch(`${API}/companies/${firmId}`),
          fetch(`${API}/companies/${firmId}/score`),
          fetch(`${API}/companies/${firmId}/events`),
          fetch(`${API}/events/types`),
        ]);

        if (companyRes.status === 404) {
          if (!cancelled) setFirm(null);
          return;
        }
        if (!companyRes.ok) throw new Error(`Failed to load company (${companyRes.status})`);

        const company = await companyRes.json();
        const scoreData = scoreRes.ok ? await scoreRes.json() : null;
        const events = eventsRes.ok ? await eventsRes.json() : [];
        const eventTypes = typesRes.ok ? await typesRes.json() : [];

        if (!cancelled) setFirm(mapToFirmDetail(company, scoreData, events, eventTypes));
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [firmId]);

  return { firm, error };
}

// ─── UI components ────────────────────────────────────────────────────────────

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

function Highlight({ text, query }) {
  const q = normalize(query);
  const t = String(text);
  if (!q) return t;
  const lower = t.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return t;
  return (
    <>
      {t.slice(0, idx)}
      <mark>{t.slice(idx, idx + q.length)}</mark>
      {t.slice(idx + q.length)}
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

// ─── Pages ────────────────────────────────────────────────────────────────────

function SearchPage() {
  const { firms, error } = useCompanies();
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    inputRef.current?.focus?.();
  }, []);

  const matches = React.useMemo(() => {
    if (!firms) return [];
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
            <div className="hint">Try: Allegro, CD Projekt, Asseco, PKO BP</div>
          </div>
        </div>

        <div className="divider" role="presentation" />

        <div className="resultsHeader">
          <h2>Results</h2>
          <div className="count" aria-live="polite">
            {firms === null && !error ? "Loading…" : countText}
          </div>
        </div>

        {error ? (
          <div className="empty">Could not load firms: {error}</div>
        ) : firms === null ? (
          <div className="empty">Loading firms…</div>
        ) : matches.length ? (
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
          <div className="empty">No firms found.</div>
        )}

        <div className="footerNote">Risk labels and scores are derived from database events and sentiment data.</div>
      </section>
    </main>
  );
}

function FirmPage({ firmId }) {
  const { firm, error } = useCompanyDetail(firmId);
  const firmScore = clampScore(firm?.score);

  return (
    <main className="wrap">
      <header className="pageHeader">
        <Link to="/" className="backLink">
          ← Back
        </Link>
        <h1>{firm?.name ?? (error ? "Error" : firmId ? "Loading…" : "Firm not found")}</h1>
        <p className="sub">Demo only. Scores are calculated from database events and article sentiment.</p>
      </header>

      {error ? (
        <section className="card" aria-label="Error">
          <div className="empty">Could not load firm: {error}</div>
        </section>
      ) : firm === null && !error ? (
        <section className="card" aria-label="Loading">
          <div className="empty">Loading…</div>
        </section>
      ) : firm ? (
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

          {firm.categories.length > 0 && (
            <>
              <div className="panelTitle">What this score is based on</div>
              <ul className="catList" aria-label="Risk categories">
                {firm.categories.map((c) => (
                  <CategoryRow key={c.id} category={c} />
                ))}
              </ul>
            </>
          )}

          <div className="footerNote">Scores reflect events and article sentiment recorded in the database.</div>
        </section>
      ) : (
        <section className="card" aria-label="Not found">
          <div className="empty">Firm not found.</div>
        </section>
      )}
    </main>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const pathname = usePathname();
  const firmId = parseFirmIdFromPathname(pathname);

  if (!firmId) return <SearchPage />;
  return <FirmPage firmId={firmId} />;
}
