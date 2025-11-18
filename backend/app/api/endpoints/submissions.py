from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.db.database import get_db
from app.schemas import schemas
from app.crud import crud
from app.core.llm_evaluator import LLMEvaluator
from app.core.deps import get_current_configurator
from app.models.models import User

router = APIRouter(prefix="/api/configure/submissions", tags=["submissions"])

@router.get("/", response_model=List[schemas.SubmissionResponse])
def get_submissions(
    entry_id: Optional[uuid.UUID] = None,
    student_user_id: Optional[uuid.UUID] = None,
    skip: int = 0,
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    if entry_id:
        submissions = crud.get_submissions_by_entry(db, entry_id=entry_id)
    elif student_user_id:
        submissions = crud.get_submissions_by_student(db, student_user_id=student_user_id)
    else:
        # Return all submissions for configurator view
        submissions = db.query(crud.Submission).offset(skip).limit(limit).all()
    
    # Convert to response model and populate student_name
    submission_responses = []
    for submission in submissions:
        submission_dict = schemas.SubmissionResponse.from_orm(submission).dict()
        submission_dict["student_name"] = submission.student.full_name if submission.student else None
        submission_responses.append(submission_dict)
    
    return submission_responses


@router.get("/{submission_id}", response_model=schemas.SubmissionWithOutcome)
def get_submission(
    submission_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    db_submission = crud.get_submission(db, submission_id=submission_id)
    if db_submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Get associated outcome if it exists
    outcome = crud.get_outcome_by_submission(db, submission_id=submission_id)
    
    # Convert to pydantic model and populate student_name
    submission_dict = schemas.SubmissionResponse.from_orm(db_submission).dict()
    submission_dict["student_name"] = db_submission.student.full_name if db_submission.student else None
    
    if outcome:
        submission_dict["outcome"] = schemas.OutcomeResponse.from_orm(outcome)
    
    return submission_dict


@router.post("/{submission_id}/generate_outcome", response_model=schemas.OutcomeResponse)
def generate_outcome(
    submission_id: uuid.UUID, 
    force_regenerate: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_configurator)
):
    # Check if submission exists
    submission = crud.get_submission(db, submission_id=submission_id)
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Check if outcome already exists
    existing_outcome = crud.get_outcome_by_submission(db, submission_id=submission_id)
    if existing_outcome and not force_regenerate:
        raise HTTPException(
            status_code=400,
            detail="Outcome already exists for this submission. Use force_regenerate=true to regenerate."
        )
    
    # If outcome exists and we're force regenerating, delete the existing one
    if existing_outcome and force_regenerate:
        crud.delete_outcome(db=db, outcome_id=existing_outcome.outcome_id)
    
    # Get entry details
    entry_details = crud.get_entry_by_submission(db, submission_id=submission_id)
    
    # Get submission history for this student and entry (excluding current submission)
    submission_history = crud.get_all_submissions_by_entry_and_student(
        db, 
        entry_id=submission.entry_id, 
        student_user_id=submission.student_user_id
    )
    # Filter out the current submission from history
    submission_history = [s for s in submission_history if s.submission_id != submission_id]
    
    # Generate LLM response with history
    llm_outcome = LLMEvaluator.generate_feedback(
        submission_content=submission.content,
        submission_title=submission.submission_title,
        entry_details=entry_details,
        submission_history=submission_history
    )
    
    # Create outcome
    outcome_create = schemas.OutcomeCreate(
        submission_id=submission_id,
        outcome_data=llm_outcome.model_dump(), # Convert to dict
        is_llm_generated=True
    )
    
    new_outcome = crud.create_outcome(db=db, outcome=outcome_create)
    
    return new_outcome