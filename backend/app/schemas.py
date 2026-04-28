from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# --- CompanyAlias ---
class CompanyAliasBase(BaseModel):
    name: str
    type: Optional[str] = None

class CompanyAliasCreate(CompanyAliasBase):
    pass

class CompanyAliasOut(CompanyAliasBase):
    id: int
    company_id: int
    model_config = {"from_attributes": True}


# --- CompanyIdentifier ---
class CompanyIdentifierBase(BaseModel):
    type: Optional[str] = None
    value: str

class CompanyIdentifierCreate(CompanyIdentifierBase):
    pass

class CompanyIdentifierOut(CompanyIdentifierBase):
    id: int
    company_id: int
    model_config = {"from_attributes": True}


# --- Company ---
class CompanyCreate(BaseModel):
    full_name: str
    nip: Optional[str] = None
    aliases: Optional[List[CompanyAliasCreate]] = []
    identifiers: Optional[List[CompanyIdentifierCreate]] = []

class CompanyOut(BaseModel):
    id: int
    full_name: str
    nip: Optional[str] = None
    aliases: List[CompanyAliasOut] = []
    identifiers: List[CompanyIdentifierOut] = []
    model_config = {"from_attributes": True}


# --- Article ---
class ArticleCreate(BaseModel):
    title: str
    url: Optional[str] = None
    content: Optional[str] = None
    sentiment: Optional[float] = None

class ArticleOut(ArticleCreate):
    id: int
    model_config = {"from_attributes": True}


class CompanyDetectionRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class CompanyDetectionCandidate(BaseModel):
    company_id: int
    full_name: str
    score: float
    matched_aliases: List[str] = []


class CompanyDetectionResponse(BaseModel):
    best_match: Optional[CompanyDetectionCandidate] = None
    candidates: List[CompanyDetectionCandidate] = []


# --- EventType ---
class EventTypeCreate(BaseModel):
    name: str
    score: Optional[int] = None

class EventTypeOut(EventTypeCreate):
    id: int
    model_config = {"from_attributes": True}


# --- Event ---
class EventCreate(BaseModel):
    company_id: int
    type_id: int
    article_id: Optional[int] = None

class EventOut(BaseModel):
    id: int
    company_id: int
    type_id: int
    article_id: Optional[int] = None
    article: Optional[ArticleOut] = None
    date: datetime
    model_config = {"from_attributes": True}


# --- CompanyScore ---
class CompanyScoreOut(BaseModel):
    id: int
    company_id: int
    score: float
    calculated_at: datetime
    model_config = {"from_attributes": True}

class CompanyScoreResponse(BaseModel):
    latest: Optional[CompanyScoreOut] = None
    history: List[CompanyScoreOut] = []


# --- CompanyArticle ---
class CompanyArticleOut(BaseModel):
    company_id: int
    article_id: int
    model_config = {"from_attributes": True}


class ScrapedArticleCreate(BaseModel):
    title: str
    url: Optional[str] = None
    source: Optional[str] = None
    published: Optional[str] = None
    summary: Optional[str] = None
    query: Optional[str] = None
    content: Optional[str] = None
    fetched_at: Optional[str] = None


class ScrapedCompanyCreate(BaseModel):
    name: str
    aliases: List[str] = []
    article_count: Optional[int] = None
    articles: List[ScrapedArticleCreate] = []
    history_points: Optional[int] = None  # ile punktów historii score wygenerować (None = 1)


class ScrapedImportRequest(BaseModel):
    fetched_at: Optional[str] = None
    companies: List[ScrapedCompanyCreate]


class ScrapedImportResponse(BaseModel):
    companies_created: int
    companies_updated: int
    articles_created: int
    article_links_created: int
    events_created: int
    scores_created: int
