from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.db.database import get_db
from app.schemas import schemas
from app.crud import crud
from app.core.deps import get_current_configurator
from app.models.models import User

router = APIRouter(prefix="/api/configure/entries", tags=["entries"])

@router.post("/", response_model=schemas.EntryResponse, status_code=status.HTTP_201_CREATED)
def create_entry(
    entry: schemas.EntryCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    # Verify flexagecomp exists
    flexagecomp = crud.get_flexagecomp(db, comp_id=entry.flex_age_comp_id)
    if flexagecomp is None:
        raise HTTPException(
            status_code=404,
            detail=f"FlexAGEComp with ID {entry.flex_age_comp_id} not found"
        )
    
    return crud.create_entry(db=db, entry=entry, creator_user_id=current_user.user_id)


@router.get("/", response_model=List[schemas.EntryResponse])
def get_entries(
    flex_age_comp_id: Optional[uuid.UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    entries = crud.get_entries(
        db, flex_age_comp_id=flex_age_comp_id, skip=skip, limit=limit
    )
    return entries


@router.get("/{entry_id}", response_model=schemas.EntryResponse)
def get_entry(
    entry_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return db_entry


@router.put("/{entry_id}", response_model=schemas.EntryResponse)
def update_entry(
    entry_id: uuid.UUID, 
    entry: schemas.EntryUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    db_entry = crud.update_entry(db, entry_id=entry_id, entry=entry)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return db_entry


@router.delete("/{entry_id}", response_model=schemas.EntryResponse)
def delete_entry(
    entry_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    db_entry = crud.delete_entry(db, entry_id=entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return db_entry


@router.get("/{entry_id}/submissions", response_model=List[schemas.SubmissionWithOutcome])
def get_submissions_for_entry(
    entry_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    submissions = crud.get_submissions_by_entry(db, entry_id=entry_id)
    
    # Convert to response models and populate student_name
    result = []
    for submission in submissions:
        submission_dict = schemas.SubmissionResponse.from_orm(submission).dict()
        submission_dict["student_name"] = submission.student.full_name if submission.student else None
        
        # Check for outcome
        outcome = crud.get_outcome_by_submission(db, submission_id=submission.submission_id)
        if outcome:
            submission_dict["outcome"] = schemas.OutcomeResponse.from_orm(outcome)
        
        result.append(submission_dict)
    
    return result


@router.get("/{entry_id}/student_states", response_model=List[schemas.StudentEntryStateWithSubmission])
def get_student_states_for_entry(
    entry_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    student_states = crud.get_student_entry_states_by_entry(db, entry_id=entry_id)
    return student_states
