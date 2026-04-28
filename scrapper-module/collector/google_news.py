"""
Krok 1: Zbieranie artykułów z Google News RSS oraz GDELT.
Dla każdej firmy (i jej wariantów nazw) pobiera listę artykułów.
"""

import asyncio
import feedparser
import json
import os
import time
import trafilatura
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, asdict
from datetime import datetime
from playwright.async_api import async_playwright
from urllib.parse import quote, urlencode
from urllib.request import urlopen

from push_to_backend import push_payload_to_backend


@dataclass
class Article:
    title: str
    url: str
    source: str
    published: str
    summary: str
    query: str          # jakiego zapytania użyto
    content: str = ""   # pełna treść artykułu (opcjonalna)
    fetched_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> dict:
        return asdict(self)


async def _resolve_urls_async(
    urls: list[str],
    timeout_ms: int = 15_000,
    parallel_pages: int = 5,
) -> list[str]:
    """Rozwiązuje listę Google News redirect URL-i równolegle używając async Playwright."""
    semaphore = asyncio.Semaphore(parallel_pages)

    async def resolve_one(idx: int, url: str, context) -> tuple[int, str]:
        async with semaphore:
            page = await context.new_page()
            try:
                await page.goto(url, wait_until="networkidle", timeout=timeout_ms)
                return idx, page.url
            except Exception:
                return idx, url
            finally:
                await page.close()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        await context.add_cookies([
            {"name": "SOCS",    "value": "CAI",    "domain": ".google.com", "path": "/"},
            {"name": "CONSENT", "value": "YES+cb", "domain": ".google.com", "path": "/"},
        ])
        tasks = [resolve_one(i, url, context) for i, url in enumerate(urls)]
        results = await asyncio.gather(*tasks)
        await browser.close()

    real_urls = [""] * len(urls)
    for idx, real_url in results:
        real_urls[idx] = real_url
    return real_urls


def _fetch_content_for_articles(
    articles: list["Article"],
    timeout_ms: int = 15_000,
    parallel_pages: int = 5,
) -> None:
    """
    Pobiera treść dla listy artykułów in-place.
    Krok 1 — async Playwright: rozwiązuje Google News redirect URL-e równolegle.
    Krok 2 — trafilatura: pobiera i parsuje treść artykułów równolegle.
    """
    if not articles:
        return

    # Krok 1: Rozwiąż URL-e równolegle (async Playwright)
    real_urls = asyncio.run(
        _resolve_urls_async([a.url for a in articles], timeout_ms, parallel_pages)
    )
    for art, real_url in zip(articles, real_urls):
        line = f"  -> {art.title[:55]}  ({real_url[:55]})"
        print(line.encode("ascii", errors="replace").decode("ascii"), flush=True)

    # Krok 2: Pobierz HTML i wyciągnij treść równolegle (trafilatura)
    def _fetch_one(idx_url):
        idx, url = idx_url
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            return idx, ""
        return idx, trafilatura.extract(downloaded) or ""

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(_fetch_one, (i, u)): i for i, u in enumerate(real_urls)}
        for future in as_completed(futures):
            idx, content = future.result()
            articles[idx].content = content


def fetch_google_news(
    query: str,
    lang: str = "pl",
    country: str = "PL",
    max_results: int = 10,
) -> list[Article]:
    """
    Pobiera artykuły z Google News RSS dla podanego zapytania.

    Args:
        query:       np. "PKN Orlen korupcja" albo sama nazwa firmy "Mbank"
        lang:        kod języka (domyślnie "pl")
        country:     kod kraju  (domyślnie "PL")
        max_results: maksymalna liczba artykułów do zwrócenia (domyślnie 10)

    Returns:
        Lista artykułów (może być pusta jeśli brak wyników lub błąd sieci).
    """
    url = (
        f"https://news.google.com/rss/search"
        f"?q={quote(query)}&hl={lang}-{country}&gl={country}&ceid={country}:{lang}"
    )

    feed = feedparser.parse(url)

    articles = []
    for entry in feed.entries[:max_results]:
        source = ""
        if hasattr(entry, "source"):
            source = entry.source.get("title", "")

        articles.append(Article(
            title=entry.get("title", ""),
            url=entry.get("link", ""),
            source=source,
            published=entry.get("published", ""),
            summary=entry.get("summary", ""),
            query=query,
        ))

    return articles


def fetch_gdelt_news(
    query: str,
    max_results: int = 250,
    timespan: str = "LAST30DAYS",
    lang: str = "Polish",
) -> list[Article]:
    """
    Pobiera artykuły z GDELT DOC 2.0 API dla podanego zapytania.

    Args:
        query:       np. "PKN Orlen" — nazwa firmy lub alias
        max_results: maks. liczba artykułów (max 250 per request w GDELT)
        timespan:    zakres czasu, np. "LAST7DAYS", "LAST30DAYS", "LAST3MONTHS"
        lang:        język źródła, np. "Polish", "English"

    Returns:
        Lista artykułów (może być pusta jeśli brak wyników lub błąd sieci).
    """
    full_query = f"{query} sourcelang:{lang}"
    params = urlencode({
        "query": full_query,
        "mode": "artlist",
        "maxrecords": min(max_results, 250),
        "format": "json",
        "timespan": timespan,
    })
    url = f"https://api.gdeltproject.org/api/v2/doc/doc?{params}"

    try:
        time.sleep(1)  # unikaj 429 od GDELT
        with urlopen(url, timeout=30) as response:
            data = json.loads(response.read().decode())
    except Exception as e:
        label = f"  [GDELT] blad pobierania dla '{query}': {e}"
        print(label.encode("ascii", errors="replace").decode("ascii"), flush=True)
        return []

    articles = []
    for entry in (data.get("articles") or []):
        published = entry.get("seendate", "")
        try:
            published = datetime.strptime(published, "%Y%m%dT%H%M%SZ").isoformat()
        except Exception:
            pass

        articles.append(Article(
            title=entry.get("title", ""),
            url=entry.get("url", ""),
            source=entry.get("domain", ""),
            published=published,
            summary="",
            query=query,
        ))

    return articles


def collect_for_company(
    company_name: str,
    aliases: list[str] | None = None,
    fetch_content: bool = False,
    max_results_google: int = 10,
    max_results_gdelt: int = 250,
    gdelt_timespan: str = "LAST30DAYS",
    use_gdelt: bool = True,
) -> list[Article]:
    """
    Zbiera artykuły dla firmy z Google News i (opcjonalnie) GDELT.
    Usuwa duplikaty (ten sam URL z różnych zapytań i źródeł).

    Args:
        company_name:        Główna nazwa firmy, np. "PKN Orlen S.A."
        aliases:             Dodatkowe warianty, np. ["Orlen", "PKN"]
        fetch_content:       Czy pobierać pełną treść artykułów (wolniejsze).
        max_results_google:  Maks. artykułów per query z Google News.
        max_results_gdelt:   Maks. artykułów per query z GDELT (max 250).
        gdelt_timespan:      Zakres czasu dla GDELT, np. "LAST7DAYS", "LAST30DAYS".
        use_gdelt:           Czy używać GDELT jako dodatkowego źródła.

    Returns:
        Unikalna lista artykułów ze wszystkich zapytań i źródeł.
    """
    queries = [company_name] + (aliases or [])

    seen_urls: set[str] = set()
    results: list[Article] = []

    for query in queries:
        for art in fetch_google_news(query, max_results=max_results_google):
            if art.url not in seen_urls:
                seen_urls.add(art.url)
                results.append(art)

    if use_gdelt:
        gdelt_label = f"  [GDELT] pobieranie ({gdelt_timespan})..."
        print(gdelt_label.encode("ascii", errors="replace").decode("ascii"), flush=True)
        for query in queries:
            for art in fetch_gdelt_news(query, max_results=max_results_gdelt, timespan=gdelt_timespan):
                if art.url not in seen_urls:
                    seen_urls.add(art.url)
                    results.append(art)

    if fetch_content:
        _fetch_content_for_articles(results)

    return results


def collect_all_to_json(
    companies: list[dict],
    fetch_content: bool = False,
    max_results_google: int = 10,
    max_results_gdelt: int = 250,
    gdelt_timespan: str = "LAST30DAYS",
    use_gdelt: bool = True,
) -> str:
    """
    Zbiera artykuły dla listy firm i zwraca wynik jako JSON string.

    Format wejścia:
        [{"name": "PKN Orlen", "aliases": ["Orlen"]}, ...]

    Format wyjścia:
        {
          "fetched_at": "...",
          "companies": [
            {
              "name": "PKN Orlen",
              "article_count": 23,
              "articles": [ { ...Article fields... }, ... ]
            },
            ...
          ]
        }
    """
    output = {
        "fetched_at": datetime.utcnow().isoformat(),
        "companies": [],
    }

    for company in companies:
        label = f"\n[{company['name']}]"
        print(label.encode("ascii", errors="replace").decode("ascii"), flush=True)
        articles = collect_for_company(
            company["name"],
            company.get("aliases"),
            fetch_content=fetch_content,
            max_results_google=max_results_google,
            max_results_gdelt=max_results_gdelt,
            gdelt_timespan=gdelt_timespan,
            use_gdelt=use_gdelt,
        )
        output["companies"].append({
            "name": company["name"],
            "aliases": company.get("aliases", []),
            "article_count": len(articles),
            "articles": [a.to_dict() for a in articles],
        })

    return json.dumps(output, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# Uruchomienie demo
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # history_points  — ile punktów na wykresie historii (1 = tylko aktualny)
    # gdelt_timespan  — None = bez GDELT (szybkie), string = pobierz historyczne artykuły
    COMPANIES = [
        {
            "name": "PKN Orlen",
            "aliases": ["Orlen", "PKN Orlen S.A."],
            "history_points": 2,
            "gdelt_timespan": "LAST3MONTHS",
        },
        {
            "name": "CD Projekt",
            "aliases": ["CD Projekt Red", "CDPR"],
            "history_points": 3,
            "gdelt_timespan": "LAST3MONTHS",
        },
        {
            "name": "Allegro",
            "aliases": ["Allegro.eu", "allegro.pl"],
            "history_points": 1,
            "gdelt_timespan": None,
        },
        {
            "name": "KGHM Polska Miedź",
            "aliases": ["KGHM"],
            "history_points": 1,
            "gdelt_timespan": None,
        },
        {
            "name": "LPP",
            "aliases": ["Reserved", "Cropp"],
            "history_points": 1,
            "gdelt_timespan": None,
        },
        {
            "name": "PKO Bank Polski",
            "aliases": ["PKO BP", "PKO"],
            "history_points": 1,
            "gdelt_timespan": None,
        },
    ]

    auto_push = os.getenv("AUTO_PUSH_TO_BACKEND", "").strip().lower() in {"1", "true", "yes"}
    fetch_content = os.getenv("FETCH_CONTENT", "false").strip().lower() in {"1", "true", "yes"}
    max_results_google = int(os.getenv("MAX_RESULTS_GOOGLE", "10"))
    max_results_gdelt = int(os.getenv("MAX_RESULTS_GDELT", "50"))
    # gdelt_timespan i use_gdelt są teraz per-company (w COMPANIES powyżej)

    fetched_at = datetime.utcnow().isoformat()
    all_companies_output = []
    output_path = "articles.json"

    for company in COMPANIES:
        label = f"\n[{company['name']}]"
        print(label.encode("ascii", errors="replace").decode("ascii"), flush=True)

        company_gdelt_timespan = company.get("gdelt_timespan")
        use_gdelt_for_company = company_gdelt_timespan is not None

        articles = collect_for_company(
            company["name"],
            company.get("aliases"),
            fetch_content=fetch_content,
            max_results_google=max_results_google,
            max_results_gdelt=max_results_gdelt,
            gdelt_timespan=company_gdelt_timespan or "LAST7DAYS",
            use_gdelt=use_gdelt_for_company,
        )

        company_data = {
            "name": company["name"],
            "aliases": company.get("aliases", []),
            "article_count": len(articles),
            "articles": [a.to_dict() for a in articles],
            "history_points": company.get("history_points", 1),
        }
        all_companies_output.append(company_data)

        count_label = f"  -> {len(articles)} artykulow"
        print(count_label.encode("ascii", errors="replace").decode("ascii"), flush=True)

        # Push natychmiast po zebraniu danych dla tej firmy
        if auto_push:
            single_payload = {"fetched_at": fetched_at, "companies": [company_data]}
            try:
                response = push_payload_to_backend(single_payload)
                result_label = f"  -> backend: ok ({response})"
                print(result_label.encode("ascii", errors="replace").decode("ascii"), flush=True)
            except Exception as e:
                err_label = f"  -> backend: blad {e}"
                print(err_label.encode("ascii", errors="replace").decode("ascii"), flush=True)

        # Nadpisuj plik po każdej firmie — masz dane nawet jeśli scraper crashnie
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump({"fetched_at": fetched_at, "companies": all_companies_output}, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Zapisano do {output_path}", flush=True)
