"""
Seed script — dodaje mockowe dane do bazy.
Uruchomienie:
    cd backend
    python seed.py

Skrypt działa TYLKO gdy APP_ENV=development.
"""
import os
import sys
from datetime import datetime, timedelta
from app.database import SessionLocal, Base, engine
from app import models

if os.getenv("APP_ENV") != "development":
    print("Seed zablokowany — APP_ENV != 'development'. Ustaw APP_ENV=development, żeby uruchomić.")
    sys.exit(1)

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # --- EventTypes ---
    event_types_data = [
        {"name": "Naruszenie danych", "score": -30},
        {"name": "Nowe partnerstwo", "score": 20},
        {"name": "Wyrok sądowy (negatywny)", "score": -50},
        {"name": "Nagroda branżowa", "score": 15},
        {"name": "Kontrola regulatora", "score": -20},
        {"name": "Ekspansja rynkowa", "score": 25},
    ]
    event_types = []
    for et in event_types_data:
        obj = models.EventType(**et)
        db.add(obj)
        event_types.append(obj)
    db.flush()

    # --- Companies ---
    companies_data = [
        {
            "full_name": "Allegro.eu S.A.",
            "nip": "5213737823",
            "aliases": [
                {"name": "Allegro", "type": "brand"},
                {"name": "allegro.pl", "type": "domain"},
            ],
            "identifiers": [
                {"type": "KRS", "value": "0000808264"},
                {"type": "REGON", "value": "365839328"},
            ],
        },
        {
            "full_name": "CD Projekt S.A.",
            "nip": "7342867148",
            "aliases": [
                {"name": "CD Projekt", "type": "brand"},
                {"name": "CDPR", "type": "ticker"},
            ],
            "identifiers": [
                {"type": "KRS", "value": "0000006865"},
                {"type": "REGON", "value": "492707333"},
            ],
        },
        {
            "full_name": "Asseco Poland S.A.",
            "nip": "5220001220",
            "aliases": [
                {"name": "Asseco", "type": "brand"},
                {"name": "ACP", "type": "ticker"},
            ],
            "identifiers": [
                {"type": "KRS", "value": "0000033391"},
            ],
        },
        {
            "full_name": "PKO Bank Polski S.A.",
            "nip": "5260026896",
            "aliases": [
                {"name": "PKO BP", "type": "brand"},
                {"name": "PKO", "type": "ticker"},
            ],
            "identifiers": [
                {"type": "KRS", "value": "0000026438"},
            ],
        },
    ]

    companies = []
    for cd in companies_data:
        company = models.Company(full_name=cd["full_name"], nip=cd["nip"])
        db.add(company)
        db.flush()

        for a in cd.get("aliases", []):
            db.add(models.CompanyAlias(company_id=company.id, **a))

        for i in cd.get("identifiers", []):
            db.add(models.CompanyIdentifier(company_id=company.id, **i))

        companies.append(company)

    db.flush()

    # --- Articles ---
    articles_data = [
        {
            "title": "Allegro wprowadza nowy program lojalnościowy Smart+",
            "url": "https://example.com/allegro-smart-plus",
            "content": "Allegro ogłosiło rozszerzenie programu Smart o dodatkowe benefity dla użytkowników premium.",
            "sentiment": 0.75,
        },
        {
            "title": "Wyciek danych klientów sklepu internetowego powiązanego z Allegro",
            "url": "https://example.com/allegro-data-leak",
            "content": "Ujawniono lukę bezpieczeństwa w systemie zewnętrznego partnera platformy handlowej.",
            "sentiment": -0.80,
        },
        {
            "title": "CD Projekt nawiązuje współpracę z Microsoft Azure",
            "url": "https://example.com/cdpr-microsoft",
            "content": "CD Projekt Red przenosi infrastrukturę gier online na platformę chmurową Azure.",
            "sentiment": 0.65,
        },
        {
            "title": "Pozew zbiorowy przeciwko CD Projekt za Cyberpunk 2077",
            "url": "https://example.com/cdpr-lawsuit",
            "content": "Gracze złożyli pozew zbiorowy domagając się zwrotu pieniędzy za wadliwe wydanie gry.",
            "sentiment": -0.90,
        },
        {
            "title": "Asseco zdobywa kontrakt na systemy dla Ministerstwa Finansów",
            "url": "https://example.com/asseco-mf-contract",
            "content": "Asseco Poland wygrało przetarg na dostarczenie systemu podatkowego wartego 120 mln zł.",
            "sentiment": 0.80,
        },
        {
            "title": "PKO BP laureatem nagrody Bank Roku 2025",
            "url": "https://example.com/pko-bank-roku",
            "content": "PKO Bank Polski został wyróżniony tytułem Banku Roku przez magazyn Euromoney.",
            "sentiment": 0.85,
        },
        {
            "title": "Kontrola KNF w PKO BP — podejrzenie nieprawidłowości",
            "url": "https://example.com/pko-knf",
            "content": "Komisja Nadzoru Finansowego wszczęła kontrolę procedur kredytowych w PKO Banku Polskim.",
            "sentiment": -0.55,
        },
    ]

    articles = []
    for ad in articles_data:
        obj = models.Article(**ad)
        db.add(obj)
        articles.append(obj)
    db.flush()

    # --- CompanyArticles (powiązania) ---
    # Allegro → artykuły 0, 1
    db.add(models.CompanyArticle(company_id=companies[0].id, article_id=articles[0].id))
    db.add(models.CompanyArticle(company_id=companies[0].id, article_id=articles[1].id))
    # CD Projekt → artykuły 2, 3
    db.add(models.CompanyArticle(company_id=companies[1].id, article_id=articles[2].id))
    db.add(models.CompanyArticle(company_id=companies[1].id, article_id=articles[3].id))
    # Asseco → artykuł 4
    db.add(models.CompanyArticle(company_id=companies[2].id, article_id=articles[4].id))
    # PKO BP → artykuły 5, 6
    db.add(models.CompanyArticle(company_id=companies[3].id, article_id=articles[5].id))
    db.add(models.CompanyArticle(company_id=companies[3].id, article_id=articles[6].id))

    # --- Events ---
    now = datetime.utcnow()
    events_data = [
        # Allegro
        {"company": companies[0], "event_type": event_types[0], "article": articles[1], "days_ago": 10},
        {"company": companies[0], "event_type": event_types[1], "article": articles[0], "days_ago": 5},
        # CD Projekt
        {"company": companies[1], "event_type": event_types[2], "article": articles[3], "days_ago": 30},
        {"company": companies[1], "event_type": event_types[1], "article": articles[2], "days_ago": 7},
        # Asseco
        {"company": companies[2], "event_type": event_types[5], "article": articles[4], "days_ago": 3},
        # PKO BP
        {"company": companies[3], "event_type": event_types[3], "article": articles[5], "days_ago": 14},
        {"company": companies[3], "event_type": event_types[4], "article": articles[6], "days_ago": 2},
    ]

    for ed in events_data:
        db.add(models.Event(
            company_id=ed["company"].id,
            type_id=ed["event_type"].id,
            article_id=ed["article"].id,
            date=now - timedelta(days=ed["days_ago"]),
        ))

    db.flush()

    # --- Scores ---
    scores_data = [
        {"company": companies[0], "score": -5.0,  "days_ago": 10},
        {"company": companies[0], "score": 12.5,  "days_ago": 1},
        {"company": companies[1], "score": -65.0, "days_ago": 25},
        {"company": companies[1], "score": -48.0, "days_ago": 5},
        {"company": companies[2], "score": 33.0,  "days_ago": 3},
        {"company": companies[3], "score": 20.0,  "days_ago": 14},
        {"company": companies[3], "score": 5.0,   "days_ago": 1},
    ]

    for sd in scores_data:
        db.add(models.CompanyScore(
            company_id=sd["company"].id,
            score=sd["score"],
            calculated_at=now - timedelta(days=sd["days_ago"]),
        ))

    db.commit()
    print("Seed zakończony pomyślnie.")
    print(f"  Firmy:        {len(companies)}")
    print(f"  Artykuły:     {len(articles)}")
    print(f"  Typy zdarzeń: {len(event_types)}")
    print(f"  Zdarzenia:    {len(events_data)}")
    print(f"  Oceny:        {len(scores_data)}")

except Exception as e:
    db.rollback()
    print(f"Błąd: {e}")
    raise
finally:
    db.close()
