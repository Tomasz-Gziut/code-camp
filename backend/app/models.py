from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Company(Base):
    __tablename__ = "company"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    nip = Column(String(20), unique=True, nullable=False)

    aliases = relationship("CompanyAlias", back_populates="company", cascade="all, delete-orphan")
    identifiers = relationship("CompanyIdentifier", back_populates="company", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="company", cascade="all, delete-orphan")
    scores = relationship("CompanyScore", back_populates="company", cascade="all, delete-orphan")
    company_articles = relationship("CompanyArticle", back_populates="company", cascade="all, delete-orphan")


class CompanyAlias(Base):
    __tablename__ = "company_alias"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("company.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50))

    company = relationship("Company", back_populates="aliases")


class CompanyIdentifier(Base):
    __tablename__ = "company_identifier"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("company.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50))
    value = Column(String(100), nullable=False)

    company = relationship("Company", back_populates="identifiers")


class EventType(Base):
    __tablename__ = "event_type"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    score = Column(Integer)

    events = relationship("Event", back_populates="event_type")


class Article(Base):
    __tablename__ = "article"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    url = Column(String(500))
    content = Column(Text)
    sentiment = Column(Float)

    company_articles = relationship("CompanyArticle", back_populates="article", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "event"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("company.id", ondelete="CASCADE"), nullable=False)
    type_id = Column(Integer, ForeignKey("event_type.id"), nullable=False)
    article_id = Column(Integer, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="events")
    event_type = relationship("EventType", back_populates="events")


class CompanyArticle(Base):
    __tablename__ = "company_article"

    company_id = Column(Integer, ForeignKey("company.id", ondelete="CASCADE"), primary_key=True)
    article_id = Column(Integer, ForeignKey("article.id", ondelete="CASCADE"), primary_key=True)

    company = relationship("Company", back_populates="company_articles")
    article = relationship("Article", back_populates="company_articles")


class CompanyScore(Base):
    __tablename__ = "company_score"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("company.id"))
    score = Column(Float)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="scores")
