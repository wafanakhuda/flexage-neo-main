"""
Background task handlers for async processing.
"""
import uuid
import logging
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.crud import crud
from app.schemas import schemas
from app.core.llm_evaluator import LLMEvaluator
from app.core.constants import STATUS_OUTCOME_AVAILABLE

logger = logging.getLogger(__name__)


def generate_outcome_background_task(submission_id: uuid.UUID):
    """
    Background task to generate an outcome for a submission.
    This task runs asynchronously after a student submits their work.
    """
    db: Session = SessionLocal()
    try:
        logger.info(f"Starting background outcome generation for submission {submission_id}")
        
        # Get the submission
        submission = crud.get_submission(db, submission_id=submission_id)
        if not submission:
            logger.error(f"Submission {submission_id} not found")
            return
        
        # Check if outcome already exists
        existing_outcome = crud.get_outcome_by_submission(db, submission_id=submission_id)
        if existing_outcome:
            logger.info(f"Outcome already exists for submission {submission_id}")
            return
         # Get the entry details for context
        entry = crud.get_entry_by_submission(db, submission_id=submission_id)
        if not entry:
            logger.error(f"Entry not found for submission {submission_id}")
            return
        
        # Get submission history for this student and entry (excluding current submission)
        submission_history = crud.get_all_submissions_by_entry_and_student(
            db, 
            entry_id=submission.entry_id, 
            student_user_id=submission.student_user_id
        )
        # Filter out the current submission from history
        submission_history = [s for s in submission_history if s.submission_id != submission_id]

        # Generate feedback using LLM
        logger.info(f"Generating LLM feedback for submission {submission_id} with {len(submission_history)} previous submissions")
        llm_outcome = LLMEvaluator.generate_feedback(
            submission_content=submission.content,
            submission_title=submission.submission_title,
            entry_details=entry,
            submission_history=submission_history
        )
        
        # Create the outcome
        outcome_create = schemas.OutcomeCreate(
            submission_id=submission_id,
            outcome_data=llm_outcome.model_dump(),
            is_llm_generated=True
        )
        
        new_outcome = crud.create_outcome(db=db, outcome=outcome_create)
        logger.info(f"Created outcome {new_outcome.outcome_id} for submission {submission_id}")
        
        # Update the student entry state to indicate outcome is available
        crud.create_or_update_student_entry_state(
            db, 
            entry_id=submission.entry_id,
            student_user_id=submission.student_user_id,
            status=STATUS_OUTCOME_AVAILABLE
        )
        
        logger.info(f"Background outcome generation completed for submission {submission_id}")
        
    except Exception as e:
        logger.error(f"Error generating outcome for submission {submission_id}: {str(e)}")
        # TODO: Could implement retry logic or error notification here
        
    finally:
        db.close()
