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
    nip: str
    aliases: Optional[List[CompanyAliasCreate]] = []
    identifiers: Optional[List[CompanyIdentifierCreate]] = []

class CompanyOut(BaseModel):
    id: int
    full_name: str
    nip: str
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
