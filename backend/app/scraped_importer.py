from sqlalchemy.orm import Session

from app import models, schemas
from app.article_analysis import EVENT_TYPE_DEFINITIONS, analyze_article
from app.crud import (
    get_article_by_url,
    get_company_article_link,
    get_company_by_name_or_alias,
    get_event_by_company_article_and_type,
    get_event_types,
    calculate_and_save_score,
)


def _ensure_default_event_types(db: Session) -> dict[str, models.EventType]:
    existing_types = {
        event_type.name.casefold(): event_type
        for event_type in get_event_types(db, skip=0, limit=1000)
    }

    for event_type_name, definition in EVENT_TYPE_DEFINITIONS.items():
        key = event_type_name.casefold()
        if key in existing_types:
            continue

        event_type = models.EventType(name=event_type_name, score=definition["score"])
        db.add(event_type)
        db.flush()
        existing_types[key] = event_type

    return existing_types


def import_scraped_companies(
    db: Session,
    payload: schemas.ScrapedImportRequest,
) -> schemas.ScrapedImportResponse:
    event_types_by_name = _ensure_default_event_types(db)
    companies_created = 0
    companies_updated = 0
    articles_created = 0
    article_links_created = 0
    events_created = 0
    scores_created = 0
    touched_company_ids: set[int] = set()

    for scraped_company in payload.companies:
        company = get_company_by_name_or_alias(db, scraped_company.name)
        was_created = company is None

        if company is None:
            company = models.Company(full_name=scraped_company.name, nip=None)
            db.add(company)
            db.flush()
            companies_created += 1
            touched_company_ids.add(company.id)
        else:
            companies_updated += 1

        alias_names = {scraped_company.name, *scraped_company.aliases}
        existing_aliases = {alias.name for alias in company.aliases}

        for alias_name in sorted(alias_names):
            if not alias_name or alias_name == company.full_name or alias_name in existing_aliases:
                continue
            db.add(models.CompanyAlias(company_id=company.id, name=alias_name, type="scraped"))
            touched_company_ids.add(company.id)

        if was_created:
            db.flush()

        for scraped_article in scraped_company.articles:
            article = get_article_by_url(db, scraped_article.url)
            if article is None:
                article = models.Article(
                    title=scraped_article.title,
                    url=scraped_article.url,
                    content=scraped_article.content,
                    sentiment=None,
                )
                db.add(article)
                db.flush()
                articles_created += 1
                touched_company_ids.add(company.id)
            else:
                updated = False
                if scraped_article.content and not article.content:
                    article.content = scraped_article.content
                    updated = True
                if scraped_article.title and not article.title:
                    article.title = scraped_article.title
                    updated = True
                if updated:
                    db.add(article)
                    touched_company_ids.add(company.id)

            analysis = analyze_article(
                title=scraped_article.title,
                content=scraped_article.content or article.content or "",
            )
            if article.sentiment != analysis.sentiment:
                article.sentiment = analysis.sentiment
                db.add(article)
                touched_company_ids.add(company.id)

            link = get_company_article_link(db, company.id, article.id)
            if link is None:
                db.add(models.CompanyArticle(company_id=company.id, article_id=article.id))
                article_links_created += 1
                touched_company_ids.add(company.id)

            if analysis.event_type_name:
                event_type = event_types_by_name[analysis.event_type_name.casefold()]
                event = get_event_by_company_article_and_type(db, company.id, article.id, event_type.id)
                if event is None:
                    db.add(
                        models.Event(
                            company_id=company.id,
                            type_id=event_type.id,
                            article_id=article.id,
                        )
                    )
                    events_created += 1
                    touched_company_ids.add(company.id)

    db.flush()

    for company_id in sorted(touched_company_ids):
        calculate_and_save_score(db, company_id)
        scores_created += 1

    return schemas.ScrapedImportResponse(
        companies_created=companies_created,
        companies_updated=companies_updated,
        articles_created=articles_created,
        article_links_created=article_links_created,
        events_created=events_created,
        scores_created=scores_created,
    )
