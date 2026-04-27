from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/companies", tags=["companies"])


@router.post("", response_model=schemas.CompanyOut, status_code=201)
def create_company(data: schemas.CompanyCreate, db: Session = Depends(get_db)):
    return crud.create_company(db, data)


@router.get("/{company_id}", response_model=schemas.CompanyOut)
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = crud.get_company(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company
