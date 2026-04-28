from datetime import datetime
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


def _get_company_articles(db: Session, company_id: int) -> list[models.Article]:
    return (
        db.query(models.Article)
        .join(models.CompanyArticle, models.CompanyArticle.article_id == models.Article.id)
        .filter(models.CompanyArticle.company_id == company_id)
        .all()
    )


# --- Scoring ---

def calculate_and_save_score(db: Session, company_id: int) -> models.CompanyScore:
    event_rows = (
        db.query(models.Event, models.EventType)
        .join(models.EventType, models.Event.type_id == models.EventType.id)
        .filter(models.Event.company_id == company_id)
        .all()
    )
    company_articles = _get_company_articles(db, company_id)

    event_score = sum((event_type.score or 0) for _, event_type in event_rows)
    sentiment_score = sum((article.sentiment or 0.0) * 10 for article in company_articles)
    total = float(event_score) + sentiment_score

    score_record = models.CompanyScore(company_id=company_id, score=total)
    db.add(score_record)
    db.commit()
    db.refresh(score_record)
    return score_record


def generate_score_history(
    db: Session,
    company_id: int,
    num_snapshots: int = 1,
) -> models.CompanyScore | None:
    event_rows = (
        db.query(models.Event, models.EventType)
        .join(models.EventType, models.Event.type_id == models.EventType.id)
        .filter(models.Event.company_id == company_id)
        .order_by(models.Event.date)
        .all()
    )
    company_articles = _get_company_articles(db, company_id)

    db.query(models.CompanyScore).filter(models.CompanyScore.company_id == company_id).delete()

    if not event_rows and not company_articles:
        return None

    now = datetime.utcnow()
    article_dates_by_id = {
        article.id: article.published_at or now
        for article in company_articles
    }

    contributions: list[dict[str, object]] = []

    for article in company_articles:
        value = float((article.sentiment or 0.0) * 10)
        if value:
            contributions.append({
                "date": article.published_at or now,
                "value": value,
            })

    for event, event_type in event_rows:
        value = float(event_type.score or 0)
        if value:
            contributions.append({
                "date": event.date or article_dates_by_id.get(event.article_id) or now,
                "value": value,
            })

    if not contributions:
        contributions.append({
            "date": now,
            "value": 0.0,
        })

    contributions.sort(key=lambda item: item["date"])
    contribution_count = len(contributions)
    snapshot_count = max(1, min(num_snapshots, contribution_count))

    def _score_for_cutoff(cutoff: int) -> float:
        return float(sum(item["value"] for item in contributions[:cutoff]))

    cutoffs = []
    for i in range(snapshot_count):
        if i == snapshot_count - 1:
            cutoff = contribution_count
        else:
            cutoff = max(1, min(contribution_count, round(((i + 1) * contribution_count) / snapshot_count)))
        if cutoffs and cutoff <= cutoffs[-1]:
            cutoff = min(contribution_count, cutoffs[-1] + 1)
        cutoffs.append(cutoff)

    last_record = None
    for i, cutoff in enumerate(cutoffs):
        calculated_at = contributions[cutoff - 1]["date"] if i < snapshot_count - 1 else now
        record = models.CompanyScore(
            company_id=company_id,
            score=_score_for_cutoff(cutoff),
            calculated_at=calculated_at,
        )
        db.add(record)
        last_record = record

    db.flush()
    return last_record


def get_company_scores(db: Session, company_id: int) -> list[models.CompanyScore]:
    return (
        db.query(models.CompanyScore)
        .filter(models.CompanyScore.company_id == company_id)
        .order_by(models.CompanyScore.calculated_at.desc())
        .all()
    )
