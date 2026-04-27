"""
Seed script — dodaje mockowe dane do bazy.
Uruchomienie:
    cd backend
    python seed.py

Skrypt działa TYLKO gdy APP_ENV=development.
Przy każdym uruchomieniu czyści dane i wstawia od nowa.
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
    # --- Wyczyść istniejące dane (odwrotna kolejność FK) ---
    db.query(models.CompanyScore).delete()
    db.query(models.Event).delete()
    db.query(models.CompanyArticle).delete()
    db.query(models.CompanyIdentifier).delete()
    db.query(models.CompanyAlias).delete()
    db.query(models.Company).delete()
    db.query(models.Article).delete()
    db.query(models.EventType).delete()
    db.commit()
    print("Istniejące dane wyczyszczone.")

    # --- EventTypes (dokładnie 5 → pentagon na wykresie) ---
    # "Ekspansja rynkowa" nie występuje już jako osobny typ.
    # Zdarzenia wzrostowe trafiają do wspólnej kategorii "Partnerstwa i wzrost".
    event_types_data = [
        {"name": "Naruszenie danych",        "score": -30},
        {"name": "Partnerstwa i wzrost",      "score":  22},
        {"name": "Postępowania prawne",       "score": -50},
        {"name": "Nagrody i reputacja",       "score":  15},
        {"name": "Nadzór regulacyjny",        "score": -20},
    ]
    event_types = []
    for et in event_types_data:
        obj = models.EventType(**et)
        db.add(obj)
        event_types.append(obj)
    db.flush()

    ET_BREACH    = event_types[0]  # -30
    ET_PARTNER   = event_types[1]  # +22
    ET_LAWSUIT   = event_types[2]  # -50
    ET_AWARD     = event_types[3]  # +15
    ET_REGULATOR = event_types[4]  # -20

    # --- Companies ---
    companies_data = [
        {
            "full_name": "Allegro.eu S.A.",
            "nip": "5213737823",
            "aliases": [
                {"name": "Allegro",    "type": "brand"},
                {"name": "allegro.pl", "type": "domain"},
            ],
            "identifiers": [
                {"type": "KRS",   "value": "0000808264"},
                {"type": "REGON", "value": "365839328"},
            ],
        },
        {
            "full_name": "CD Projekt S.A.",
            "nip": "7342867148",
            "aliases": [
                {"name": "CD Projekt", "type": "brand"},
                {"name": "CDPR",       "type": "ticker"},
            ],
            "identifiers": [
                {"type": "KRS",   "value": "0000006865"},
                {"type": "REGON", "value": "492707333"},
            ],
        },
        {
            "full_name": "Asseco Poland S.A.",
            "nip": "5220001220",
            "aliases": [
                {"name": "Asseco", "type": "brand"},
                {"name": "ACP",    "type": "ticker"},
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
                {"name": "PKO",    "type": "ticker"},
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

    allegro, cdprojekt, asseco, pko = companies
    db.flush()

    # --- Articles ---
    articles_data = [
        # Allegro
        {"title": "Allegro wprowadza nowy program lojalnościowy Smart+",
         "url": "https://example.com/allegro-smart-plus",
         "content": "Allegro ogłosiło rozszerzenie programu Smart o dodatkowe benefity.",
         "sentiment": 0.75},
        {"title": "Wyciek danych klientów sklepu powiązanego z Allegro",
         "url": "https://example.com/allegro-data-leak",
         "content": "Ujawniono lukę bezpieczeństwa w systemie zewnętrznego partnera.",
         "sentiment": -0.80},
        {"title": "Allegro laureatem nagrody E-commerce Roku",
         "url": "https://example.com/allegro-award",
         "content": "Allegro zdobyło tytuł najlepszej platformy e-commerce w regionie CEE.",
         "sentiment": 0.85},
        {"title": "Allegro otwiera centrum logistyczne w Poznaniu",
         "url": "https://example.com/allegro-logistics",
         "content": "Nowe centrum zwiększy zdolności dostaw dla sprzedawców z całej Polski.",
         "sentiment": 0.70},
        # CD Projekt
        {"title": "CD Projekt nawiązuje współpracę z Microsoft Azure",
         "url": "https://example.com/cdpr-microsoft",
         "content": "CD Projekt Red przenosi infrastrukturę gier online na platformę Azure.",
         "sentiment": 0.65},
        {"title": "Pozew zbiorowy przeciwko CD Projekt za Cyberpunk 2077",
         "url": "https://example.com/cdpr-lawsuit",
         "content": "Gracze złożyli pozew zbiorowy domagając się zwrotu pieniędzy za grę.",
         "sentiment": -0.90},
        {"title": "Wyciek kodu źródłowego CD Projekt — hakerzy żądają okupu",
         "url": "https://example.com/cdpr-hack",
         "content": "Cyberprzestępcy wykradli kod źródłowy gier i grożą jego opublikowaniem.",
         "sentiment": -0.85},
        {"title": "CD Projekt otwiera nowe studio w Bostonie",
         "url": "https://example.com/cdpr-boston",
         "content": "Nowe studio zajmie się rozwojem następnej gry z serii Wiedźmin.",
         "sentiment": 0.60},
        # Asseco
        {"title": "Asseco zdobywa kontrakt na systemy dla Ministerstwa Finansów",
         "url": "https://example.com/asseco-mf-contract",
         "content": "Asseco wygrało przetarg na system podatkowy wartego 120 mln zł.",
         "sentiment": 0.80},
        {"title": "Asseco wchodzi na rynek skandynawski poprzez akwizycję",
         "url": "https://example.com/asseco-nordic",
         "content": "Przejęcie szwedzkiej firmy IT otwiera Asseco nowe rynki zbytu.",
         "sentiment": 0.75},
        {"title": "Asseco zdobywa nagrodę najlepszego dostawcy IT w sektorze publicznym",
         "url": "https://example.com/asseco-award",
         "content": "Firma wyróżniona za innowacyjne wdrożenia dla administracji rządowej.",
         "sentiment": 0.82},
        {"title": "KNF kontroluje procedury outsourcingu IT w Asseco",
         "url": "https://example.com/asseco-knf",
         "content": "Komisja sprawdza zgodność z wytycznymi dotyczącymi outsourcingu bankowego.",
         "sentiment": -0.40},
        # PKO BP
        {"title": "PKO BP laureatem nagrody Bank Roku 2025",
         "url": "https://example.com/pko-bank-roku",
         "content": "PKO Bank Polski wyróżniony tytułem Banku Roku przez magazyn Euromoney.",
         "sentiment": 0.85},
        {"title": "Kontrola KNF w PKO BP — podejrzenie nieprawidłowości",
         "url": "https://example.com/pko-knf",
         "content": "KNF wszczęła kontrolę procedur kredytowych w PKO Banku Polskim.",
         "sentiment": -0.55},
        {"title": "PKO BP nawiązuje strategiczne partnerstwo z Visa",
         "url": "https://example.com/pko-visa",
         "content": "Nowa umowa z Visa umożliwi wdrożenie płatności biometrycznych.",
         "sentiment": 0.72},
        {"title": "PKO BP otwiera oddział bankowości korporacyjnej w Berlinie",
         "url": "https://example.com/pko-berlin",
         "content": "Bank ekspanduje na rynek zachodnioeuropejski obsługując polskie firmy za granicą.",
         "sentiment": 0.68},
    ]

    articles = []
    for ad in articles_data:
        obj = models.Article(**ad)
        db.add(obj)
        articles.append(obj)
    db.flush()

    # Indeksy artykułów dla czytelności
    A = articles  # A[0]..A[15]

    # --- CompanyArticles ---
    company_article_pairs = [
        (allegro,   A[0]),  (allegro,   A[1]),  (allegro,   A[2]),  (allegro,   A[3]),
        (cdprojekt, A[4]),  (cdprojekt, A[5]),  (cdprojekt, A[6]),  (cdprojekt, A[7]),
        (asseco,    A[8]),  (asseco,    A[9]),  (asseco,    A[10]), (asseco,    A[11]),
        (pko,       A[12]), (pko,       A[13]), (pko,       A[14]), (pko,       A[15]),
    ]
    for company, article in company_article_pairs:
        db.add(models.CompanyArticle(company_id=company.id, article_id=article.id))

    # --- Events (wszystkie 5 typów na firmę → spójny pentagon) ---
    now = datetime.utcnow()
    events_data = [
        # Allegro (platforma e-commerce — głównie pozytywna)
        {"company": allegro,   "event_type": ET_BREACH,    "article": A[1],  "days_ago": 10},
        {"company": allegro,   "event_type": ET_PARTNER,   "article": A[0],  "days_ago":  5},
        {"company": allegro,   "event_type": ET_PARTNER,   "article": A[3],  "days_ago": 30},  # wzrost/ekspansja wpada do tej samej osi
        {"company": allegro,   "event_type": ET_LAWSUIT,   "article": A[1],  "days_ago": 90},  # stary spór
        {"company": allegro,   "event_type": ET_AWARD,     "article": A[2],  "days_ago": 20},
        {"company": allegro,   "event_type": ET_REGULATOR, "article": A[1],  "days_ago": 60},
        # CD Projekt (gaming — problemy prawne i naruszenia)
        {"company": cdprojekt, "event_type": ET_BREACH,    "article": A[6],  "days_ago": 45},
        {"company": cdprojekt, "event_type": ET_PARTNER,   "article": A[4],  "days_ago":  7},
        {"company": cdprojekt, "event_type": ET_PARTNER,   "article": A[7],  "days_ago": 60},
        {"company": cdprojekt, "event_type": ET_LAWSUIT,   "article": A[5],  "days_ago": 30},
        {"company": cdprojekt, "event_type": ET_LAWSUIT,   "article": A[5],  "days_ago": 120}, # 2 pozwy
        {"company": cdprojekt, "event_type": ET_AWARD,     "article": A[4],  "days_ago": 180},
        {"company": cdprojekt, "event_type": ET_REGULATOR, "article": A[6],  "days_ago": 50},
        # Asseco (IT dla sektora publicznego — stabilna firma)
        {"company": asseco,    "event_type": ET_BREACH,    "article": A[8],  "days_ago": 200},  # dawne zdarzenie
        {"company": asseco,    "event_type": ET_PARTNER,   "article": A[9],  "days_ago": 15},
        {"company": asseco,    "event_type": ET_PARTNER,   "article": A[8],  "days_ago":  3},
        {"company": asseco,    "event_type": ET_LAWSUIT,   "article": A[8],  "days_ago": 300},
        {"company": asseco,    "event_type": ET_AWARD,     "article": A[10], "days_ago": 25},
        {"company": asseco,    "event_type": ET_AWARD,     "article": A[10], "days_ago":  8},   # 2 nagrody
        {"company": asseco,    "event_type": ET_REGULATOR, "article": A[11], "days_ago":  8},
        # PKO BP (bank — nadzorowany, nagradzany)
        {"company": pko,       "event_type": ET_BREACH,    "article": A[13], "days_ago": 150},
        {"company": pko,       "event_type": ET_PARTNER,   "article": A[14], "days_ago": 10},
        {"company": pko,       "event_type": ET_LAWSUIT,   "article": A[13], "days_ago": 180},
        {"company": pko,       "event_type": ET_AWARD,     "article": A[12], "days_ago": 14},
        {"company": pko,       "event_type": ET_AWARD,     "article": A[12], "days_ago": 60},   # 2 nagrody
        {"company": pko,       "event_type": ET_REGULATOR, "article": A[13], "days_ago":  2},
        {"company": pko,       "event_type": ET_REGULATOR, "article": A[15], "days_ago": 21},   # 2 kontrole
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
        # Allegro: breach(-30) + 2×partner(+44) + lawsuit(-50) + award(+15) + regulator(-20) = -41, sentiment ≈ -0.025 → -0.25
        {"company": allegro,   "score": -41.25, "days_ago": 1},
        # CD Projekt: breach(-30) + 2×partner(+44) + 2×lawsuit(-100) + award(+15) + regulator(-20) = -91, sentiment ≈ -0.40 → -4.0
        {"company": cdprojekt, "score": -95.0,  "days_ago": 1},
        # Asseco: breach(-30) + 2×partner(+44) + lawsuit(-50) + 2×award(+30) + regulator(-20) = -26, sentiment ≈ +0.49 → +4.9
        {"company": asseco,    "score":  -21.1, "days_ago": 1},
        # PKO BP: breach(-30) + partner(+22) + lawsuit(-50) + 2×award(+30) + 2×regulator(-40) = -68, sentiment ≈ +0.18 → +1.8
        {"company": pko,       "score":  -66.2, "days_ago": 1},
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
