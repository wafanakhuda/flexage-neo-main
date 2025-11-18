from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, desc
from typing import Optional, List
import uuid

from app.models.models import FlexAGEComp, Entry, StudentEntryState, Submission, Outcome, User, student_flex_age_comp_enrollments
from app.schemas import schemas
from app.schemas.auth import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password
from app.core.constants import STATUS_NOT_SUBMITTED


# User CRUD operations
def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    db_obj = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        hashed_password=hashed_password
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_user_by_id(db: Session, user_id: uuid.UUID) -> Optional[User]:
    return db.query(User).filter(User.user_id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()


def update_user(db: Session, user_id: uuid.UUID, user: UserUpdate) -> Optional[User]:
    db_obj = db.query(User).filter(User.user_id == user_id).first()
    if db_obj:
        update_data = user.dict(exclude_unset=True)
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def enroll_student_in_comp(db: Session, student_user_id: uuid.UUID, flex_age_comp_id: uuid.UUID) -> bool:
    """Enroll a student in a FlexAGEComp."""
    # Check if already enrolled
    existing = db.execute(
        student_flex_age_comp_enrollments.select().where(
            and_(
                student_flex_age_comp_enrollments.c.user_id == student_user_id,
                student_flex_age_comp_enrollments.c.flex_age_comp_id == flex_age_comp_id
            )
        )
    ).first()
    
    if existing:
        return False  # Already enrolled
    
    # Insert enrollment
    db.execute(
        student_flex_age_comp_enrollments.insert().values(
            user_id=student_user_id,
            flex_age_comp_id=flex_age_comp_id
        )
    )
    db.commit()
    return True


def unenroll_student_from_comp(db: Session, student_user_id: uuid.UUID, flex_age_comp_id: uuid.UUID) -> bool:
    """Unenroll a student from a FlexAGEComp."""
    result = db.execute(
        student_flex_age_comp_enrollments.delete().where(
            and_(
                student_flex_age_comp_enrollments.c.user_id == student_user_id,
                student_flex_age_comp_enrollments.c.flex_age_comp_id == flex_age_comp_id
            )
        )
    )
    db.commit()
    return result.rowcount > 0


def get_student_enrolled_comps(db: Session, student_user_id: uuid.UUID) -> List[FlexAGEComp]:
    """Get all FlexAGEComps a student is enrolled in."""
    user = db.query(User).filter(User.user_id == student_user_id).first()
    if user:
        return user.enrolled_flex_age_comps
    return []


def get_enrolled_students_for_comp(db: Session, flex_age_comp_id: uuid.UUID) -> List[User]:
    """Get all students enrolled in a FlexAGEComp."""
    comp = db.query(FlexAGEComp).filter(FlexAGEComp.comp_id == flex_age_comp_id).first()
    if comp:
        return comp.enrolled_students
    return []


# FlexAGEComp CRUD operations
def create_flexagecomp(db: Session, flexagecomp: schemas.FlexAGECompCreate, creator_user_id: Optional[uuid.UUID] = None) -> FlexAGEComp:
    db_obj = FlexAGEComp(
        **flexagecomp.dict(),
        created_by_user_id=creator_user_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_flexagecomp(db: Session, comp_id: uuid.UUID) -> Optional[FlexAGEComp]:
    return db.query(FlexAGEComp).filter(FlexAGEComp.comp_id == comp_id).first()


def get_flexagecomps(db: Session, skip: int = 0, limit: int = 100) -> List[FlexAGEComp]:
    return db.query(FlexAGEComp).offset(skip).limit(limit).all()


def update_flexagecomp(db: Session, comp_id: uuid.UUID, flexagecomp: schemas.FlexAGECompUpdate) -> Optional[FlexAGEComp]:
    db_obj = db.query(FlexAGEComp).filter(FlexAGEComp.comp_id == comp_id).first()
    if db_obj:
        update_data = flexagecomp.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj


def delete_flexagecomp(db: Session, comp_id: uuid.UUID) -> Optional[FlexAGEComp]:
    db_obj = db.query(FlexAGEComp).filter(FlexAGEComp.comp_id == comp_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj


# Entry CRUD operations
def create_entry(db: Session, entry: schemas.EntryCreate, creator_user_id: Optional[uuid.UUID] = None) -> Entry:
    db_obj = Entry(
        **entry.dict(),
        created_by_user_id=creator_user_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_entry(db: Session, entry_id: uuid.UUID) -> Optional[Entry]:
    return db.query(Entry).filter(Entry.entry_id == entry_id).first()


def get_entry_by_submission(db: Session, submission_id: uuid.UUID) -> Optional[Entry]:
    submission = db.query(Submission).filter(Submission.submission_id == submission_id).first()
    if submission:
        return submission.entry
    return None


def get_entries(db: Session, flex_age_comp_id: Optional[uuid.UUID] = None, skip: int = 0, limit: int = 100) -> List[Entry]:
    query = db.query(Entry)
    if flex_age_comp_id:
        query = query.filter(Entry.flex_age_comp_id == flex_age_comp_id)
    return query.offset(skip).limit(limit).all()


def update_entry(db: Session, entry_id: uuid.UUID, entry: schemas.EntryUpdate) -> Optional[Entry]:
    db_obj = db.query(Entry).filter(Entry.entry_id == entry_id).first()
    if db_obj:
        update_data = entry.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj


def delete_entry(db: Session, entry_id: uuid.UUID) -> Optional[Entry]:
    db_obj = db.query(Entry).filter(Entry.entry_id == entry_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj


# StudentEntryState CRUD operations
def get_student_entry_state(db: Session, entry_id: uuid.UUID, student_user_id: uuid.UUID) -> Optional[StudentEntryState]:
    return db.query(StudentEntryState).filter(
        StudentEntryState.entry_id == entry_id,
        StudentEntryState.student_user_id == student_user_id
    ).first()


def get_student_entry_state_with_submission(db: Session, entry_id: uuid.UUID, student_user_id: uuid.UUID) -> Optional[StudentEntryState]:
    """Get student entry state with its associated submission and outcome if available"""
    state = db.query(StudentEntryState).options(
        selectinload(StudentEntryState.submission).selectinload(Submission.outcome)
    ).filter(
        StudentEntryState.entry_id == entry_id,
        StudentEntryState.student_user_id == student_user_id
    ).first()

    return state


def get_student_entry_states_by_entry(db: Session, entry_id: uuid.UUID) -> List[StudentEntryState]:
    return db.query(StudentEntryState).filter(StudentEntryState.entry_id == entry_id).all()


def get_student_entry_states_by_student(db: Session, student_user_id: uuid.UUID) -> List[StudentEntryState]:
    return db.query(StudentEntryState).filter(StudentEntryState.student_user_id == student_user_id).all()


def create_or_update_student_entry_state(
    db: Session, entry_id: uuid.UUID, student_user_id: uuid.UUID, status: str
) -> StudentEntryState:
    db_obj = db.query(StudentEntryState).filter(
        StudentEntryState.entry_id == entry_id,
        StudentEntryState.student_user_id == student_user_id
    ).first()

    if db_obj:
        db_obj.status = status
    else:
        db_obj = StudentEntryState(
            entry_id=entry_id,
            student_user_id=student_user_id,
            status=status
        )
        db.add(db_obj)

    db.commit()
    db.refresh(db_obj)
    return db_obj


# Submission CRUD operations
def create_submission(db: Session, submission: schemas.SubmissionCreate, background_tasks=None) -> Submission:
    # First, get or create the student entry state
    student_state = get_student_entry_state(db, submission.entry_id, submission.student_user_id)

    if not student_state:
        from app.core.constants import STATUS_PROCESSING
        student_state = create_or_update_student_entry_state(
            db, submission.entry_id, submission.student_user_id, STATUS_PROCESSING
        )
    else:
        from app.core.constants import STATUS_PROCESSING
        student_state.status = STATUS_PROCESSING
        db.commit()

    # Create the submission
    db_submission = Submission(
        entry_id=submission.entry_id,
        student_user_id=submission.student_user_id,
        submission_title=submission.submission_title,
        content=submission.content
    )

    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    
    # Schedule automatic evaluation as a background task
    if background_tasks:
        from app.core.background_tasks import generate_outcome_background_task
        background_tasks.add_task(
            generate_outcome_background_task,
            submission_id=db_submission.submission_id
        )
    
    return db_submission


def get_submission(db: Session, submission_id: uuid.UUID) -> Optional[Submission]:
    return db.query(Submission).filter(Submission.submission_id == submission_id).first()


def get_submissions_by_entry(db: Session, entry_id: uuid.UUID) -> List[Submission]:
    return db.query(Submission).filter(Submission.entry_id == entry_id).all()


def get_submissions_by_student(db: Session, student_user_id: uuid.UUID) -> List[Submission]:
    return db.query(Submission).filter(Submission.student_user_id == student_user_id).all()


def get_submission_by_entry_and_student(db: Session, entry_id: uuid.UUID, student_user_id: uuid.UUID) -> Optional[Submission]:
    return db.query(Submission)\
        .filter(
            Submission.entry_id == entry_id,
            Submission.student_user_id == student_user_id
        )\
        .order_by(desc(Submission.submitted_at))\
        .first()


def get_all_submissions_by_entry_and_student(db: Session, entry_id: uuid.UUID, student_user_id: uuid.UUID) -> List[Submission]:
    return db.query(Submission)\
        .filter(
            Submission.entry_id == entry_id,
            Submission.student_user_id == student_user_id
        )\
        .order_by(desc(Submission.submitted_at))\
        .all()


def get_entries_with_student_state_and_submission(db: Session, flex_age_comp_id: uuid.UUID, student_user_id: uuid.UUID):
    """Get entries for a FlexAGEComp with student state and submission data."""
    entries = db.query(Entry).filter(Entry.flex_age_comp_id == flex_age_comp_id).all()
    result = []
    
    for entry in entries:
        # Get or create student state
        student_state = get_student_entry_state(db, entry.entry_id, student_user_id)
        if not student_state:
            student_state = create_or_update_student_entry_state(
                db, entry.entry_id, student_user_id, STATUS_NOT_SUBMITTED
            )
        
        # Get submission if exists
        submission = get_submission_by_entry_and_student(db, entry.entry_id, student_user_id)
        
        # Create response dict
        entry_dict = schemas.EntryResponse.from_orm(entry).dict()
        student_state_dict = schemas.StudentEntryStateResponse.from_orm(student_state).dict()
        if submission:
            student_state_dict["submission"] = schemas.SubmissionResponse.from_orm(submission).dict()
        entry_dict["student_state"] = student_state_dict
        
        result.append(entry_dict)
    
    return result


def get_entry_with_student_state_and_submission(db: Session, entry_id: uuid.UUID, student_user_id: uuid.UUID):
    """Get a specific entry with student state and submission data."""
    entry = get_entry(db, entry_id)
    if not entry:
        return None
    
    # Get or create student state
    student_state = get_student_entry_state(db, entry_id, student_user_id)
    if not student_state:
        student_state = create_or_update_student_entry_state(
            db, entry_id, student_user_id, STATUS_NOT_SUBMITTED
        )
    
    # Get submission if exists
    submission = get_submission_by_entry_and_student(db, entry_id, student_user_id)
    
    # Create response dict
    entry_dict = schemas.EntryResponse.from_orm(entry).dict()
    student_state_dict = schemas.StudentEntryStateResponse.from_orm(student_state).dict()
    if submission:
        student_state_dict["submission"] = schemas.SubmissionResponse.from_orm(submission).dict()
    entry_dict["student_state"] = student_state_dict
    
    return entry_dict


# Outcome CRUD operations
def create_outcome(db: Session, outcome: schemas.OutcomeCreate) -> Outcome:
    # Create the outcome
    db_outcome = Outcome(
        submission_id=outcome.submission_id,
        outcome_data=outcome.outcome_data,
        is_llm_generated=outcome.is_llm_generated
    )

    db.add(db_outcome)
    db.commit()
    db.refresh(db_outcome)

    # Update the student entry state to indicate outcome is available
    submission = get_submission(db, outcome.submission_id)
    if submission:
        from app.core.constants import STATUS_OUTCOME_AVAILABLE
        # Get the student entry state for this submission
        student_state = get_student_entry_state(db, submission.entry_id, submission.student_user_id)
        if student_state:
            student_state.status = STATUS_OUTCOME_AVAILABLE
            db.commit()

    return db_outcome


def get_outcome(db: Session, outcome_id: uuid.UUID) -> Optional[Outcome]:
    return db.query(Outcome).filter(Outcome.outcome_id == outcome_id).first()


def get_outcome_by_submission(db: Session, submission_id: uuid.UUID) -> Optional[Outcome]:
    return db.query(Outcome).filter(Outcome.submission_id == submission_id).first()


def update_outcome(db: Session, outcome_id: uuid.UUID, outcome_update: schemas.OutcomeUpdate) -> Optional[Outcome]:
    db_outcome = db.query(Outcome).filter(Outcome.outcome_id == outcome_id).first()
    if db_outcome:
        update_data = outcome_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_outcome, key, value)
        db.commit()
        db.refresh(db_outcome)
    return db_outcome


def delete_outcome(db: Session, outcome_id: uuid.UUID) -> Optional[Outcome]:
    db_outcome = db.query(Outcome).filter(Outcome.outcome_id == outcome_id).first()
    if db_outcome:
        db.delete(db_outcome)
        db.commit()
    return db_outcome

