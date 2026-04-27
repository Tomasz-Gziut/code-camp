from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=schemas.EventOut, status_code=201)
def create_event(data: schemas.EventCreate, db: Session = Depends(get_db)):
    if not crud.get_company(db, data.company_id):
        raise HTTPException(status_code=404, detail="Company not found")
    if not crud.get_event_type(db, data.type_id):
        raise HTTPException(status_code=404, detail="EventType not found")
    return crud.create_event(db, data)


@router.post("/types", response_model=schemas.EventTypeOut, status_code=201)
def create_event_type(data: schemas.EventTypeCreate, db: Session = Depends(get_db)):
    return crud.create_event_type(db, data)
