from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=List[schemas.EventOut])
def list_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return crud.get_events(db, skip=skip, limit=limit)


@router.post("", response_model=schemas.EventOut, status_code=201)
def create_event(data: schemas.EventCreate, db: Session = Depends(get_db)):
    if not crud.get_company(db, data.company_id):
        raise HTTPException(status_code=404, detail="Company not found")
    if not crud.get_event_type(db, data.type_id):
        raise HTTPException(status_code=404, detail="EventType not found")
    return crud.create_event(db, data)


# /types must be registered before /{event_id} to avoid shadowing
@router.get("/types", response_model=List[schemas.EventTypeOut])
def list_event_types(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return crud.get_event_types(db, skip=skip, limit=limit)


@router.post("/types", response_model=schemas.EventTypeOut, status_code=201)
def create_event_type(data: schemas.EventTypeCreate, db: Session = Depends(get_db)):
    return crud.create_event_type(db, data)


@router.get("/types/{type_id}", response_model=schemas.EventTypeOut)
def get_event_type(type_id: int, db: Session = Depends(get_db)):
    event_type = crud.get_event_type(db, type_id)
    if not event_type:
        raise HTTPException(status_code=404, detail="EventType not found")
    return event_type


@router.get("/{event_id}", response_model=schemas.EventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
