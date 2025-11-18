from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db.database import get_db
from app.crud import crud
from app.schemas import schemas
from app.core.deps import get_current_student
from app.models.models import User

router = APIRouter(prefix="/api/student", tags=["student"])

@router.get("/flexagecomps", response_model=List[schemas.FlexAGECompResponse])
def get_student_flexagecomps(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """Get FlexAGEComps the current student is enrolled in."""
    flexagecomps = crud.get_student_enrolled_comps(db, student_user_id=current_user.user_id)
    return flexagecomps[skip:skip+limit]  # Apply pagination


@router.get("/flexagecomps/{comp_id}/entries", response_model=List[schemas.EntryWithStudentStateWithSubmission])
def get_student_entries_for_comp(
    comp_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """Get entries for a FlexAGEComp the current student is enrolled in."""
    # Check if student is enrolled in this FlexAGEComp
    enrolled_comps = crud.get_student_enrolled_comps(db, student_user_id=current_user.user_id)
    if not any(comp.comp_id == comp_id for comp in enrolled_comps):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not enrolled in this FlexAGEComp"
        )
    
    # Get entries for this comp with student state
    entries = crud.get_entries_with_student_state_and_submission(
        db, 
        flex_age_comp_id=comp_id, 
        student_user_id=current_user.user_id
    )
    return entries


@router.get("/entries/{entry_id}", response_model=schemas.EntryWithStudentStateWithSubmission)
def get_student_entry_details(
    entry_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """Get entry details if student is enrolled in the associated FlexAGEComp."""
    # Get the entry and verify access
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # Check if student is enrolled in the associated FlexAGEComp
    enrolled_comps = crud.get_student_enrolled_comps(db, student_user_id=current_user.user_id)
    if not any(comp.comp_id == db_entry.flex_age_comp_id for comp in enrolled_comps):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not enrolled in this FlexAGEComp"
        )
    
    # Get entry with student state and submission
    entry_with_state = crud.get_entry_with_student_state_and_submission(
        db, 
        entry_id=entry_id, 
        student_user_id=current_user.user_id
    )
    return entry_with_state


@router.post("/entries/{entry_id}/submit", response_model=schemas.SubmissionResponse)
def submit_entry(
    entry_id: uuid.UUID,
    submission: schemas.StudentSubmissionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """Submit work for an entry."""
    # Verify entry exists and student has access
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # Check if student is enrolled in the associated FlexAGEComp
    enrolled_comps = crud.get_student_enrolled_comps(db, student_user_id=current_user.user_id)
    if not any(comp.comp_id == db_entry.flex_age_comp_id for comp in enrolled_comps):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not enrolled in this FlexAGEComp"
        )
    
    # Create full submission object with authenticated user data
    full_submission = schemas.SubmissionCreate(
        submission_title=submission.submission_title,
        content=submission.content,
        entry_id=entry_id,
        student_user_id=current_user.user_id
    )
    
    # Create submission (always allow multiple submissions)
    db_submission = crud.create_submission(db=db, submission=full_submission, background_tasks=background_tasks)
    return db_submission


@router.get("/submissions/{submission_id}", response_model=schemas.SubmissionWithOutcome)
def get_student_submission(
    submission_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """Get submission details if it belongs to the current student."""
    db_submission = crud.get_submission(db, submission_id=submission_id)
    if not db_submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Verify this submission belongs to the current student
    if db_submission.student_user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this submission"
        )
    
    # Get associated outcome if it exists
    outcome = crud.get_outcome_by_submission(db, submission_id=submission_id)
    
    # Convert to response model
    submission_dict = schemas.SubmissionResponse.from_orm(db_submission).dict()
    if outcome:
        submission_dict["outcome"] = schemas.OutcomeResponse.from_orm(outcome)
    
    return submission_dict


@router.get("/submissions", response_model=List[schemas.SubmissionResponse])
def get_student_submissions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """Get all submissions by the current student."""
    submissions = crud.get_submissions_by_student(db, student_user_id=current_user.user_id)
    return submissions[skip:skip+limit]  # Apply pagination


@router.get("/entries/{entry_id}/submissions", response_model=List[schemas.SubmissionWithOutcome])
def get_student_submissions_for_entry(
    entry_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """Get all submissions (and their outcomes) by current student for a specific entry."""
    # Ensure entry exists and student is enrolled (reuse existing checks)
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    enrolled = crud.get_student_enrolled_comps(db, student_user_id=current_user.user_id)
    if not any(comp.comp_id == db_entry.flex_age_comp_id for comp in enrolled):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this FlexAGEComp")
    # Fetch all submissions
    submissions = crud.get_all_submissions_by_entry_and_student(db, entry_id=entry_id, student_user_id=current_user.user_id)
    # Attach outcomes
    results: List[schemas.SubmissionWithOutcome] = []
    for sub in submissions:
        outcome = crud.get_outcome_by_submission(db, submission_id=sub.submission_id)
        sub_dict = schemas.SubmissionResponse.from_orm(sub).dict()
        if outcome:
            sub_dict["outcome"] = schemas.OutcomeResponse.from_orm(outcome)
        results.append(sub_dict)
    return results


