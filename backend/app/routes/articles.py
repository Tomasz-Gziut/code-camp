from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("", response_model=List[schemas.ArticleOut])
def list_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return crud.get_articles(db, skip=skip, limit=limit)


@router.post("", response_model=schemas.ArticleOut, status_code=201)
def create_article(data: schemas.ArticleCreate, db: Session = Depends(get_db)):
    return crud.create_article(db, data)


@router.get("/{article_id}", response_model=schemas.ArticleOut)
def get_article(article_id: int, db: Session = Depends(get_db)):
    article = crud.get_article(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article
