"""
Krok 1: Zbieranie artykułów z Google News RSS.
Dla każdej firmy (i jej wariantów nazw) pobiera listę artykułów.
"""

import feedparser
import httpx
from urllib.parse import quote
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Article:
    title: str
    url: str
    source: str
    published: str
    summary: str
    query: str          # jakiego zapytania użyto
    fetched_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


def fetch_google_news(query: str, lang: str = "pl", country: str = "PL") -> list[Article]:
    """
    Pobiera artykuły z Google News RSS dla podanego zapytania.

    Args:
        query:   np. "PKN Orlen korupcja" albo sama nazwa firmy "Mbank"
        lang:    kod języka (domyślnie "pl")
        country: kod kraju  (domyślnie "PL")

    Returns:
        Lista artykułów (może być pusta jeśli brak wyników lub błąd sieci).
    """
    url = (
        f"https://news.google.com/rss/search"
        f"?q={quote(query)}&hl={lang}-{country}&gl={country}&ceid={country}:{lang}"
    )

    feed = feedparser.parse(url)

    articles = []
    for entry in feed.entries:
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


def collect_for_company(company_name: str, aliases: list[str] | None = None) -> list[Article]:
    """
    Zbiera artykuły dla firmy używając jej nazwy i opcjonalnych aliasów.
    Usuwa duplikaty (ten sam URL z różnych zapytań).

    Args:
        company_name: Główna nazwa firmy, np. "PKN Orlen S.A."
        aliases:      Dodatkowe warianty, np. ["Orlen", "PKN"]

    Returns:
        Unikalna lista artykułów ze wszystkich zapytań.
    """
    queries = [company_name] + (aliases or [])

    seen_urls: set[str] = set()
    results: list[Article] = []

    for query in queries:
        articles = fetch_google_news(query)
        for art in articles:
            if art.url not in seen_urls:
                seen_urls.add(art.url)
                results.append(art)

    return results


# ---------------------------------------------------------------------------
# Uruchomienie demo
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Przykładowe firmy do przetestowania
    COMPANIES = [
        {
            "name": "PKN Orlen",
            "aliases": ["Orlen", "PKN Orlen S.A."],
        },
        {
            "name": "mBank",
            "aliases": ["BRE Bank"],
        },
        {
            "name": "CD Projekt",
            "aliases": ["CD Projekt Red", "CDPR"],
        },
    ]

    for company in COMPANIES:
        print(f"\n{'='*60}")
        print(f"  Firma: {company['name']}")
        print(f"{'='*60}")

        articles = collect_for_company(company["name"], company.get("aliases"))

        if not articles:
            print("  Brak wyników.")
            continue

        print(f"  Znaleziono: {len(articles)} artykułów\n")
        for i, art in enumerate(articles[:5], 1):   # pokaż max 5
            print(f"  [{i}] {art.title}")
            print(f"      Źródło:    {art.source}")
            print(f"      Data:      {art.published}")
            print(f"      URL:       {art.url}")
            print()
