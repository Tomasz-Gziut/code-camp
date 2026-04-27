"""
Seed script - dodaje mockowe dane do bazy.
Uruchomienie:
    cd backend
    python seed.py

Skrypt dziala TYLKO gdy APP_ENV=development.
Przy kazdym uruchomieniu czysci dane i wstawia od nowa.
"""
import os
import sys
from datetime import datetime, timedelta

from app import models
from app.database import Base, SessionLocal, engine

if os.getenv("APP_ENV") != "development":
    print("Seed zablokowany - APP_ENV != 'development'. Ustaw APP_ENV=development, zeby uruchomic.")
    sys.exit(1)

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # --- Wyczysc istniejace dane (odwrotna kolejnosc FK) ---
    db.query(models.CompanyScore).delete()
    db.query(models.Event).delete()
    db.query(models.CompanyArticle).delete()
    db.query(models.CompanyIdentifier).delete()
    db.query(models.CompanyAlias).delete()
    db.query(models.Company).delete()
    db.query(models.Article).delete()
    db.query(models.EventType).delete()
    db.commit()
    print("Istniejace dane wyczyszczone.")

    # --- EventTypes (dokladnie 5 -> pentagon na wykresie) ---
    event_types_data = [
        {"name": "Naruszenie danych", "score": -30},
        {"name": "Partnerstwa i wzrost", "score": 22},
        {"name": "Postepowania prawne", "score": -50},
        {"name": "Nagrody i reputacja", "score": 15},
        {"name": "Nadzor regulacyjny", "score": -20},
    ]
    event_types = []
    for et in event_types_data:
        obj = models.EventType(**et)
        db.add(obj)
        event_types.append(obj)
    db.flush()

    ET_BREACH = event_types[0]
    ET_PARTNER = event_types[1]
    ET_LAWSUIT = event_types[2]
    ET_AWARD = event_types[3]
    ET_REGULATOR = event_types[4]

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
        for alias in cd.get("aliases", []):
            db.add(models.CompanyAlias(company_id=company.id, **alias))
        for identifier in cd.get("identifiers", []):
            db.add(models.CompanyIdentifier(company_id=company.id, **identifier))
        companies.append(company)

    allegro, cdprojekt, asseco, pko = companies
    db.flush()

    # --- Articles ---
    articles_data = [
        {"title": "Allegro wprowadza nowy program lojalnosciowy Smart+", "url": "https://example.com/allegro-smart-plus", "content": "Allegro oglosilo rozszerzenie programu Smart o dodatkowe benefity.", "sentiment": 0.75},
        {"title": "Wyciek danych klientow sklepu powiazanego z Allegro", "url": "https://example.com/allegro-data-leak", "content": "Ujawniono luke bezpieczenstwa w systemie zewnetrznego partnera.", "sentiment": -0.80},
        {"title": "Allegro laureatem nagrody E-commerce Roku", "url": "https://example.com/allegro-award", "content": "Allegro zdobylo tytul najlepszej platformy e-commerce w regionie CEE.", "sentiment": 0.85},
        {"title": "Allegro otwiera centrum logistyczne w Poznaniu", "url": "https://example.com/allegro-logistics", "content": "Nowe centrum zwiekszy zdolnosci dostaw dla sprzedawcow z calej Polski.", "sentiment": 0.70},
        {"title": "CD Projekt nawiazuje wspolprace z Microsoft Azure", "url": "https://example.com/cdpr-microsoft", "content": "CD Projekt Red przenosi infrastrukture gier online na platforme Azure.", "sentiment": 0.65},
        {"title": "Pozew zbiorowy przeciwko CD Projekt za Cyberpunk 2077", "url": "https://example.com/cdpr-lawsuit", "content": "Gracze zlozyli pozew zbiorowy domagajac sie zwrotu pieniedzy za gre.", "sentiment": -0.90},
        {"title": "Wyciek kodu zrodlowego CD Projekt - hakerzy zadaja okupu", "url": "https://example.com/cdpr-hack", "content": "Cyberprzestepcy wykradli kod zrodlowy gier i groza jego opublikowaniem.", "sentiment": -0.85},
        {"title": "CD Projekt otwiera nowe studio w Bostonie", "url": "https://example.com/cdpr-boston", "content": "Nowe studio zajmie sie rozwojem nastepnej gry z serii Wiedzmin.", "sentiment": 0.60},
        {"title": "Asseco zdobywa kontrakt na systemy dla Ministerstwa Finansow", "url": "https://example.com/asseco-mf-contract", "content": "Asseco wygralo przetarg na system podatkowy wart 120 mln zl.", "sentiment": 0.80},
        {"title": "Asseco wchodzi na rynek skandynawski poprzez akwizycje", "url": "https://example.com/asseco-nordic", "content": "Przejecie szwedzkiej firmy IT otwiera Asseco nowe rynki zbytu.", "sentiment": 0.75},
        {"title": "Asseco zdobywa nagrode najlepszego dostawcy IT w sektorze publicznym", "url": "https://example.com/asseco-award", "content": "Firma wyrozniona za innowacyjne wdrozenia dla administracji rzadowej.", "sentiment": 0.82},
        {"title": "KNF kontroluje procedury outsourcingu IT w Asseco", "url": "https://example.com/asseco-knf", "content": "Komisja sprawdza zgodnosc z wytycznymi dotyczacymi outsourcingu bankowego.", "sentiment": -0.40},
        {"title": "PKO BP laureatem nagrody Bank Roku 2025", "url": "https://example.com/pko-bank-roku", "content": "PKO Bank Polski wyrozniony tytulem Banku Roku przez magazyn Euromoney.", "sentiment": 0.85},
        {"title": "Kontrola KNF w PKO BP - podejrzenie nieprawidlowosci", "url": "https://example.com/pko-knf", "content": "KNF wszczela kontrole procedur kredytowych w PKO Banku Polskim.", "sentiment": -0.55},
        {"title": "PKO BP nawiazuje strategiczne partnerstwo z Visa", "url": "https://example.com/pko-visa", "content": "Nowa umowa z Visa umozliwi wdrozenie platnosci biometrycznych.", "sentiment": 0.72},
        {"title": "PKO BP otwiera oddzial bankowosci korporacyjnej w Berlinie", "url": "https://example.com/pko-berlin", "content": "Bank ekspanduje na rynek zachodnioeuropejski obslugujac polskie firmy za granica.", "sentiment": 0.68},
    ]

    articles = []
    for ad in articles_data:
        obj = models.Article(**ad)
        db.add(obj)
        articles.append(obj)
    db.flush()

    A = articles

    # --- CompanyArticles ---
    company_article_pairs = [
        (allegro, A[0]), (allegro, A[1]), (allegro, A[2]), (allegro, A[3]),
        (cdprojekt, A[4]), (cdprojekt, A[5]), (cdprojekt, A[6]), (cdprojekt, A[7]),
        (asseco, A[8]), (asseco, A[9]), (asseco, A[10]), (asseco, A[11]),
        (pko, A[12]), (pko, A[13]), (pko, A[14]), (pko, A[15]),
    ]
    for company, article in company_article_pairs:
        db.add(models.CompanyArticle(company_id=company.id, article_id=article.id))

    # --- Events ---
    now = datetime.utcnow()
    events_data = [
        {"company": allegro, "event_type": ET_BREACH, "article": A[1], "days_ago": 10},
        {"company": allegro, "event_type": ET_PARTNER, "article": A[0], "days_ago": 5},
        {"company": allegro, "event_type": ET_PARTNER, "article": A[3], "days_ago": 30},
        {"company": allegro, "event_type": ET_LAWSUIT, "article": A[1], "days_ago": 90},
        {"company": allegro, "event_type": ET_AWARD, "article": A[2], "days_ago": 20},
        {"company": allegro, "event_type": ET_REGULATOR, "article": A[1], "days_ago": 60},
        {"company": cdprojekt, "event_type": ET_BREACH, "article": A[6], "days_ago": 45},
        {"company": cdprojekt, "event_type": ET_PARTNER, "article": A[4], "days_ago": 7},
        {"company": cdprojekt, "event_type": ET_PARTNER, "article": A[7], "days_ago": 60},
        {"company": cdprojekt, "event_type": ET_LAWSUIT, "article": A[5], "days_ago": 30},
        {"company": cdprojekt, "event_type": ET_LAWSUIT, "article": A[5], "days_ago": 120},
        {"company": cdprojekt, "event_type": ET_AWARD, "article": A[4], "days_ago": 180},
        {"company": cdprojekt, "event_type": ET_REGULATOR, "article": A[6], "days_ago": 50},
        {"company": asseco, "event_type": ET_BREACH, "article": A[8], "days_ago": 200},
        {"company": asseco, "event_type": ET_PARTNER, "article": A[9], "days_ago": 15},
        {"company": asseco, "event_type": ET_PARTNER, "article": A[8], "days_ago": 3},
        {"company": asseco, "event_type": ET_LAWSUIT, "article": A[8], "days_ago": 300},
        {"company": asseco, "event_type": ET_AWARD, "article": A[10], "days_ago": 25},
        {"company": asseco, "event_type": ET_AWARD, "article": A[10], "days_ago": 8},
        {"company": asseco, "event_type": ET_REGULATOR, "article": A[11], "days_ago": 8},
        {"company": pko, "event_type": ET_BREACH, "article": A[13], "days_ago": 150},
        {"company": pko, "event_type": ET_PARTNER, "article": A[14], "days_ago": 10},
        {"company": pko, "event_type": ET_LAWSUIT, "article": A[13], "days_ago": 180},
        {"company": pko, "event_type": ET_AWARD, "article": A[12], "days_ago": 14},
        {"company": pko, "event_type": ET_AWARD, "article": A[12], "days_ago": 60},
        {"company": pko, "event_type": ET_REGULATOR, "article": A[13], "days_ago": 2},
        {"company": pko, "event_type": ET_REGULATOR, "article": A[15], "days_ago": 21},
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
    # Kilka historycznych snapshotow na firme, zeby endpoint /score zwracal sensowna historie zmian.
    scores_data = [
        {"company": allegro, "score": -18.4, "days_ago": 120},
        {"company": allegro, "score": -27.8, "days_ago": 60},
        {"company": allegro, "score": -35.9, "days_ago": 14},
        {"company": allegro, "score": -41.25, "days_ago": 1},
        {"company": cdprojekt, "score": -52.0, "days_ago": 150},
        {"company": cdprojekt, "score": -71.6, "days_ago": 75},
        {"company": cdprojekt, "score": -88.3, "days_ago": 20},
        {"company": cdprojekt, "score": -95.0, "days_ago": 1},
        {"company": asseco, "score": 8.6, "days_ago": 180},
        {"company": asseco, "score": -4.2, "days_ago": 45},
        {"company": asseco, "score": -12.7, "days_ago": 10},
        {"company": asseco, "score": -21.1, "days_ago": 1},
        {"company": pko, "score": -31.5, "days_ago": 180},
        {"company": pko, "score": -47.9, "days_ago": 90},
        {"company": pko, "score": -58.4, "days_ago": 30},
        {"company": pko, "score": -66.2, "days_ago": 1},
    ]

    for sd in scores_data:
        db.add(models.CompanyScore(
            company_id=sd["company"].id,
            score=sd["score"],
            calculated_at=now - timedelta(days=sd["days_ago"]),
        ))

    db.commit()
    print("Seed zakonczony pomyslnie.")
    print(f"  Firmy:        {len(companies)}")
    print(f"  Artykuly:     {len(articles)}")
    print(f"  Typy zdarzen: {len(event_types)}")
    print(f"  Zdarzenia:    {len(events_data)}")
    print(f"  Oceny:        {len(scores_data)}")

except Exception as e:
    db.rollback()
    print(f"Blad: {e}")
    raise
finally:
    db.close()
