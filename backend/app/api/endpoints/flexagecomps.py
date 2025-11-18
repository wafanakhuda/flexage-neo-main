from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db.database import get_db
from app.schemas import schemas
from app.schemas.auth import UserResponse
from app.crud import crud
from app.core.deps import get_current_configurator
from app.models.models import User

router = APIRouter(prefix="/api/configure/flexagecomps", tags=["flexagecomps"])

@router.post("/", response_model=schemas.FlexAGECompResponse, status_code=status.HTTP_201_CREATED)
def create_flexagecomp(
    flexagecomp: schemas.FlexAGECompCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    return crud.create_flexagecomp(db=db, flexagecomp=flexagecomp, creator_user_id=current_user.user_id)


@router.get("/", response_model=List[schemas.FlexAGECompResponse])
def get_flexagecomps(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    flexagecomps = crud.get_flexagecomps(db, skip=skip, limit=limit)
    return flexagecomps


@router.get("/{comp_id}", response_model=schemas.FlexAGECompResponse)
def get_flexagecomp(
    comp_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    db_flexagecomp = crud.get_flexagecomp(db, comp_id=comp_id)
    if db_flexagecomp is None:
        raise HTTPException(status_code=404, detail="FlexAGEComp not found")
    return db_flexagecomp


@router.put("/{comp_id}", response_model=schemas.FlexAGECompResponse)
def update_flexagecomp(
    comp_id: uuid.UUID, 
    flexagecomp: schemas.FlexAGECompUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    db_flexagecomp = crud.update_flexagecomp(db, comp_id=comp_id, flexagecomp=flexagecomp)
    if db_flexagecomp is None:
        raise HTTPException(status_code=404, detail="FlexAGEComp not found")
    return db_flexagecomp


@router.delete("/{comp_id}", response_model=schemas.FlexAGECompResponse)
def delete_flexagecomp(
    comp_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    db_flexagecomp = crud.delete_flexagecomp(db, comp_id=comp_id)
    if db_flexagecomp is None:
        raise HTTPException(status_code=404, detail="FlexAGEComp not found")
    return db_flexagecomp


@router.get("/{comp_id}/entries", response_model=List[schemas.EntryResponse])
def get_entries_for_flexagecomp(
    comp_id: uuid.UUID, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    db_flexagecomp = crud.get_flexagecomp(db, comp_id=comp_id)
    if db_flexagecomp is None:
        raise HTTPException(status_code=404, detail="FlexAGEComp not found")
    
    entries = crud.get_entries(db, flex_age_comp_id=comp_id, skip=skip, limit=limit)
    return entries


@router.get("/{comp_id}/enrolled_students", response_model=List[UserResponse])
def get_enrolled_students(
    comp_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    """Get all students enrolled in a FlexAGEComp."""
    db_flexagecomp = crud.get_flexagecomp(db, comp_id=comp_id)
    if db_flexagecomp is None:
        raise HTTPException(status_code=404, detail="FlexAGEComp not found")
    
    enrolled_students = crud.get_enrolled_students_for_comp(db, flex_age_comp_id=comp_id)
    return enrolled_students
