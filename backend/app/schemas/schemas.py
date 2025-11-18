import uuid
import enum
from datetime import datetime
from typing import Optional, Dict, List, Any
from pydantic import BaseModel, Field


# Enums
class EntryStatusEnum(str, enum.Enum):
    not_submitted = "not_submitted"
    submitted_processing = "submitted_processing"
    outcome_available = "outcome_available"


# FlexAGEComp schemas
class FlexAGECompBase(BaseModel):
    comp_name: str
    general_instructions: Optional[str] = None


class FlexAGECompCreate(FlexAGECompBase):
    pass


class FlexAGECompUpdate(FlexAGECompBase):
    pass


class FlexAGECompInDB(FlexAGECompBase):
    comp_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FlexAGECompResponse(FlexAGECompInDB):
    pass


# Entry schemas
class EntryBase(BaseModel):
    entry_title: str
    instructions: Optional[str] = None
    rubric_definition: Dict = Field(default_factory=dict)


class EntryCreate(EntryBase):
    flex_age_comp_id: uuid.UUID


class EntryUpdate(EntryBase):
    pass


class EntryInDB(EntryBase):
    entry_id: uuid.UUID
    flex_age_comp_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EntryResponse(EntryInDB):
    pass


# StudentEntryState schemas
class StudentEntryStateBase(BaseModel):
    entry_id: uuid.UUID
    student_user_id: uuid.UUID
    status: EntryStatusEnum = EntryStatusEnum.not_submitted


class StudentEntryStateCreate(StudentEntryStateBase):
    pass


class StudentEntryStateUpdate(BaseModel):
    status: Optional[EntryStatusEnum] = None


class StudentEntryStateInDB(StudentEntryStateBase):
    state_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudentEntryStateResponse(StudentEntryStateInDB):
    pass


# Submission schemas
class SubmissionBase(BaseModel):
    submission_title: str
    content: str
    student_user_id: uuid.UUID


class SubmissionCreate(SubmissionBase):
    entry_id: uuid.UUID


class StudentSubmissionCreate(BaseModel):
    """Schema for student submission - only requires title and content"""
    submission_title: str
    content: str


class SubmissionUpdate(BaseModel):
    submission_title: Optional[str] = None
    content: Optional[str] = None


class SubmissionInDB(SubmissionBase):
    submission_id: uuid.UUID
    entry_id: uuid.UUID
    submitted_at: datetime

    class Config:
        from_attributes = True


class SubmissionResponse(SubmissionInDB):
    student_name: Optional[str] = None


# Outcome schemas
class OutcomeBase(BaseModel):
    outcome_data: Dict[str, Any]
    is_llm_generated: bool = True


class OutcomeCreate(OutcomeBase):
    submission_id: uuid.UUID


class OutcomeUpdate(BaseModel):  # Changed from OutcomeBase
    outcome_data: Optional[Dict[str, Any]] = None
    is_llm_generated: Optional[bool] = None


class OutcomeInDB(OutcomeBase):
    outcome_id: uuid.UUID
    submission_id: uuid.UUID
    generated_at: datetime

    class Config:
        from_attributes = True


class OutcomeResponse(OutcomeInDB):
    pass


# Nested response schemas for detailed views
class EntryWithSubmissionCount(EntryResponse):
    submission_count: int


class SubmissionWithOutcome(SubmissionResponse):
    outcome: Optional[OutcomeResponse] = None


class StudentEntryStateWithSubmission(StudentEntryStateResponse):
    submission: Optional[SubmissionWithOutcome] = None


class EntryWithStudentState(EntryResponse):
    # Include submission and outcome in student state
    student_state: Optional[StudentEntryStateWithSubmission] = None


class FlexAGECompWithEntries(FlexAGECompResponse):
    entries: List[EntryResponse] = []


# Extend Entry response to include full student state with submission and outcome
class EntryWithStudentStateWithSubmission(EntryResponse):
    student_state: Optional[StudentEntryStateWithSubmission] = None
