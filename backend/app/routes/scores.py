from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/companies", tags=["scores"])


@router.post("/{company_id}/score", response_model=schemas.CompanyScoreOut, status_code=201)
def recalculate_score(company_id: int, db: Session = Depends(get_db)):
    if not crud.get_company(db, company_id):
        raise HTTPException(status_code=404, detail="Company not found")
    return crud.calculate_and_save_score(db, company_id)


@router.get("/{company_id}/score", response_model=schemas.CompanyScoreResponse)
def get_score(company_id: int, db: Session = Depends(get_db)):
    if not crud.get_company(db, company_id):
        raise HTTPException(status_code=404, detail="Company not found")
    history = crud.get_company_scores(db, company_id)
    return schemas.CompanyScoreResponse(
        latest=history[0] if history else None,
        history=history,
    )
