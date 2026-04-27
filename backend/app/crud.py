from sqlalchemy.orm import Session
from app import models, schemas
from app.company_matcher import normalize_text


# --- Company ---

def create_company(db: Session, data: schemas.CompanyCreate) -> models.Company:
    company = models.Company(full_name=data.full_name, nip=data.nip)
    db.add(company)
    db.flush()

    for alias in data.aliases or []:
        db.add(models.CompanyAlias(company_id=company.id, name=alias.name, type=alias.type))

    for identifier in data.identifiers or []:
        db.add(models.CompanyIdentifier(company_id=company.id, type=identifier.type, value=identifier.value))

    db.commit()
    db.refresh(company)
    return company


def get_company(db: Session, company_id: int) -> models.Company | None:
    return db.query(models.Company).filter(models.Company.id == company_id).first()


def get_companies(db: Session, skip: int = 0, limit: int = 100) -> list[models.Company]:
    return db.query(models.Company).offset(skip).limit(limit).all()


def get_company_by_name_or_alias(db: Session, name: str) -> models.Company | None:
    normalized_target = normalize_text(name)
    if not normalized_target:
        return None

    for company in db.query(models.Company).all():
        if normalize_text(company.full_name) == normalized_target:
            return company
        for alias in company.aliases:
            if normalize_text(alias.name) == normalized_target:
                return company
    return None


# --- Article ---

def create_article(db: Session, data: schemas.ArticleCreate) -> models.Article:
    article = models.Article(**data.model_dump())
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


def get_article(db: Session, article_id: int) -> models.Article | None:
    return db.query(models.Article).filter(models.Article.id == article_id).first()


def get_articles(db: Session, skip: int = 0, limit: int = 100) -> list[models.Article]:
    return db.query(models.Article).offset(skip).limit(limit).all()


def get_article_by_url(db: Session, url: str | None) -> models.Article | None:
    if not url:
        return None
    return db.query(models.Article).filter(models.Article.url == url).first()


def get_company_article_link(
    db: Session,
    company_id: int,
    article_id: int,
) -> models.CompanyArticle | None:
    return (
        db.query(models.CompanyArticle)
        .filter(
            models.CompanyArticle.company_id == company_id,
            models.CompanyArticle.article_id == article_id,
        )
        .first()
    )


# --- EventType ---

def create_event_type(db: Session, data: schemas.EventTypeCreate) -> models.EventType:
    event_type = models.EventType(**data.model_dump())
    db.add(event_type)
    db.commit()
    db.refresh(event_type)
    return event_type


def get_event_type(db: Session, type_id: int) -> models.EventType | None:
    return db.query(models.EventType).filter(models.EventType.id == type_id).first()


def get_event_types(db: Session, skip: int = 0, limit: int = 100) -> list[models.EventType]:
    return db.query(models.EventType).offset(skip).limit(limit).all()


# --- Event ---

def create_event(db: Session, data: schemas.EventCreate) -> models.Event:
    event = models.Event(**data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def get_events_for_company(db: Session, company_id: int) -> list[models.Event]:
    return db.query(models.Event).filter(models.Event.company_id == company_id).all()


def get_events(db: Session, skip: int = 0, limit: int = 100) -> list[models.Event]:
    return db.query(models.Event).offset(skip).limit(limit).all()


def get_event(db: Session, event_id: int) -> models.Event | None:
    return db.query(models.Event).filter(models.Event.id == event_id).first()


def get_event_by_company_article_and_type(
    db: Session,
    company_id: int,
    article_id: int,
    type_id: int,
) -> models.Event | None:
    return (
        db.query(models.Event)
        .filter(
            models.Event.company_id == company_id,
            models.Event.article_id == article_id,
            models.Event.type_id == type_id,
        )
        .first()
    )


# --- Scoring ---

_SENTIMENT_HALF_LIFE_DAYS = 90.0
_SENTIMENT_MULTIPLIER = 10.0


def _time_decay_weight(published_at, now) -> float:
    import math
    if published_at is None:
        return 0.5  # nieznana data → połowa wagi
    days_ago = max((now - published_at).days, 0)
    return math.exp(-math.log(2) * days_ago / _SENTIMENT_HALF_LIFE_DAYS)


def calculate_and_save_score(db: Session, company_id: int) -> models.CompanyScore:
    from datetime import datetime

    now = datetime.utcnow()

    # Eventy → składowa event_score
    events = (
        db.query(models.Event, models.EventType)
        .join(models.EventType, models.Event.type_id == models.EventType.id)
        .filter(models.Event.company_id == company_id)
        .all()
    )
    event_score = sum((et.score or 0) for _, et in events)

    # Sentiment ze WSZYSTKICH artykułów powiązanych z firmą (nie tylko przez eventy)
    company_articles = (
        db.query(models.Article)
        .join(models.CompanyArticle, models.CompanyArticle.article_id == models.Article.id)
        .filter(models.CompanyArticle.company_id == company_id)
        .all()
    )

    weighted_sentiment_sum = 0.0
    weight_total = 0.0
    for article in company_articles:
        if article.sentiment is None:
            continue
        weight = _time_decay_weight(article.published_at, now)
        weighted_sentiment_sum += article.sentiment * weight
        weight_total += weight

    # Normalizacja: średni ważony sentiment → skala punktowa
    sentiment_score = 0.0
    if weight_total > 0:
        sentiment_score = (weighted_sentiment_sum / weight_total) * _SENTIMENT_MULTIPLIER

    total = round(float(event_score) + sentiment_score, 2)

    score_record = models.CompanyScore(company_id=company_id, score=total)
    db.add(score_record)
    db.commit()
    db.refresh(score_record)
    return score_record


def get_company_scores(db: Session, company_id: int) -> list[models.CompanyScore]:
    return (
        db.query(models.CompanyScore)
        .filter(models.CompanyScore.company_id == company_id)
        .order_by(models.CompanyScore.calculated_at.desc())
        .all()
    )
