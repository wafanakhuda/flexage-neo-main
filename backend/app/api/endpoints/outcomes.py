from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.db.database import get_db
from app.schemas import schemas
from app.crud import crud
from app.core.deps import get_current_configurator
from app.models.models import User

router = APIRouter(prefix="/api/configure/outcomes", tags=["outcomes"])

@router.get("/{outcome_id}", response_model=schemas.OutcomeResponse)
def get_outcome(
    outcome_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    db_outcome = crud.get_outcome(db, outcome_id=outcome_id)
    if db_outcome is None:
        raise HTTPException(status_code=404, detail="Outcome not found")
    return db_outcome


@router.put("/{outcome_id}", response_model=schemas.OutcomeResponse)
def update_outcome_endpoint(
    outcome_id: uuid.UUID, 
    outcome_update: schemas.OutcomeUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    db_outcome = crud.get_outcome(db, outcome_id=outcome_id)
    if db_outcome is None:
        raise HTTPException(status_code=404, detail="Outcome not found")
    
    updated_outcome = crud.update_outcome(db=db, outcome_id=outcome_id, outcome_update=outcome_update)
    return updated_outcome
