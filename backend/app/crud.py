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

def calculate_and_save_score(db: Session, company_id: int) -> models.CompanyScore:
    events = (
        db.query(models.Event, models.EventType)
        .join(models.EventType, models.Event.type_id == models.EventType.id)
        .filter(models.Event.company_id == company_id)
        .all()
    )

    event_score = sum((et.score or 0) for _, et in events)

    article_ids = [e.article_id for e, _ in events if e.article_id is not None]
    sentiment_score = 0.0
    if article_ids:
        articles = db.query(models.Article).filter(models.Article.id.in_(article_ids)).all()
        sentiment_score = sum((a.sentiment or 0.0) * 10 for a in articles)

    total = float(event_score) + sentiment_score

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
