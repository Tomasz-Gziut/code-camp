from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.company_matcher import match_companies_to_text
from app.database import get_db

router = APIRouter(prefix="/articles", tags=["articles"])


@router.post("/detect-company", response_model=schemas.CompanyDetectionResponse)
def detect_company_from_article(
    data: schemas.CompanyDetectionRequest,
    min_score: float = Query(1.0, ge=0.0),
    db: Session = Depends(get_db),
):
    companies = crud.get_companies(db, skip=0, limit=1000)
    matches = match_companies_to_text(
        companies=companies,
        title=data.title or "",
        content=data.content or "",
        min_score=min_score,
    )

    candidates = [
        schemas.CompanyDetectionCandidate(
            company_id=match.company.id,
            full_name=match.company.full_name,
            score=match.score,
            matched_aliases=match.matched_aliases,
        )
        for match in matches
    ]

    return schemas.CompanyDetectionResponse(
        best_match=candidates[0] if candidates else None,
        candidates=candidates,
    )
