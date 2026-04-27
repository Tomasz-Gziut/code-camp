from sqlalchemy.orm import Session

from app import models, schemas
from app.crud import (
    get_article_by_url,
    get_company_article_link,
    get_company_by_name_or_alias,
)


def import_scraped_companies(
    db: Session,
    payload: schemas.ScrapedImportRequest,
) -> schemas.ScrapedImportResponse:
    companies_created = 0
    companies_updated = 0
    articles_created = 0
    article_links_created = 0

    for scraped_company in payload.companies:
        company = get_company_by_name_or_alias(db, scraped_company.name)
        was_created = company is None

        if company is None:
            company = models.Company(full_name=scraped_company.name, nip=None)
            db.add(company)
            db.flush()
            companies_created += 1
        else:
            companies_updated += 1

        alias_names = {scraped_company.name, *scraped_company.aliases}
        existing_aliases = {alias.name for alias in company.aliases}

        for alias_name in sorted(alias_names):
            if not alias_name or alias_name == company.full_name or alias_name in existing_aliases:
                continue
            db.add(models.CompanyAlias(company_id=company.id, name=alias_name, type="scraped"))

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

            link = get_company_article_link(db, company.id, article.id)
            if link is None:
                db.add(models.CompanyArticle(company_id=company.id, article_id=article.id))
                article_links_created += 1

    db.commit()

    return schemas.ScrapedImportResponse(
        companies_created=companies_created,
        companies_updated=companies_updated,
        articles_created=articles_created,
        article_links_created=article_links_created,
    )
