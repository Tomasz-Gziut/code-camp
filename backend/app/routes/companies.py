from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=List[schemas.CompanyOut])
def list_companies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return crud.get_companies(db, skip=skip, limit=limit)


@router.post("", response_model=schemas.CompanyOut, status_code=201)
def create_company(data: schemas.CompanyCreate, db: Session = Depends(get_db)):
    return crud.create_company(db, data)


@router.get("/{company_id}", response_model=schemas.CompanyOut)
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = crud.get_company(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.get("/{company_id}/aliases", response_model=List[schemas.CompanyAliasOut])
def get_company_aliases(company_id: int, db: Session = Depends(get_db)):
    company = crud.get_company(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company.aliases


@router.get("/{company_id}/identifiers", response_model=List[schemas.CompanyIdentifierOut])
def get_company_identifiers(company_id: int, db: Session = Depends(get_db)):
    company = crud.get_company(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company.identifiers


@router.get("/{company_id}/events", response_model=List[schemas.EventOut])
def get_company_events(company_id: int, db: Session = Depends(get_db)):
    if not crud.get_company(db, company_id):
        raise HTTPException(status_code=404, detail="Company not found")
    return crud.get_events_for_company(db, company_id)
