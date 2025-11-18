import uuid
import enum
from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, JSON, Boolean,
    UniqueConstraint, Table
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base

# --- Python Enum for User Roles ---
class UserRoleEnum(str, enum.Enum):
    STUDENT = "student"
    CONFIGURATOR = "configurator"
    ADMIN = "admin"

# --- Association Table for Student <> FlexAGEComp Enrollment ---
student_flex_age_comp_enrollments = Table(
    "student_flex_age_comp_enrollments",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True),
    Column("flex_age_comp_id", UUID(as_uuid=True), ForeignKey("flex_age_comps.comp_id", ondelete="CASCADE"), primary_key=True),
    Column("enrolled_at", DateTime(timezone=True), server_default=func.now())
)

# --- SQLAlchemy Models ---

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False, default=UserRoleEnum.STUDENT.value, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    # For configurators:
    created_flex_age_comps = relationship("FlexAGEComp", back_populates="creator", foreign_keys="FlexAGEComp.created_by_user_id", lazy="selectin")
    created_entries = relationship("Entry", back_populates="creator", foreign_keys="Entry.created_by_user_id", lazy="selectin")

    # For students:
    enrolled_flex_age_comps = relationship(
        "FlexAGEComp",
        secondary=student_flex_age_comp_enrollments,
        back_populates="enrolled_students",
        lazy="selectin"
    )
    submissions = relationship("Submission", back_populates="student", foreign_keys="Submission.student_user_id", cascade="all, delete-orphan", lazy="selectin")
    entry_states = relationship("StudentEntryState", back_populates="student", foreign_keys="StudentEntryState.student_user_id", cascade="all, delete-orphan", lazy="selectin")

class FlexAGEComp(Base):
    __tablename__ = "flex_age_comps"

    comp_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    comp_name = Column(String(255), nullable=False, index=True)
    general_instructions = Column(Text)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="created_flex_age_comps", foreign_keys=[created_by_user_id], lazy="joined")
    entries = relationship("Entry", back_populates="flex_age_comp", cascade="all, delete-orphan", lazy="selectin")
    enrolled_students = relationship(
        "User",
        secondary=student_flex_age_comp_enrollments,
        back_populates="enrolled_flex_age_comps",
        lazy="selectin"
    )


class Entry(Base):
    __tablename__ = "entries"

    entry_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    flex_age_comp_id = Column(UUID(as_uuid=True), ForeignKey("flex_age_comps.comp_id", ondelete="CASCADE"), nullable=False, index=True)
    entry_title = Column(String(255), nullable=False, index=True)
    instructions = Column(Text)
    rubric_definition = Column(JSON, nullable=False, default=lambda: {})
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="created_entries", foreign_keys=[created_by_user_id], lazy="joined")
    flex_age_comp = relationship("FlexAGEComp", back_populates="entries", lazy="joined")
    submissions = relationship("Submission", back_populates="entry", cascade="all, delete-orphan", lazy="selectin")
    student_states = relationship("StudentEntryState", back_populates="entry", cascade="all, delete-orphan", lazy="selectin")


class StudentEntryState(Base):
    __tablename__ = "student_entry_states"

    state_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id = Column(UUID(as_uuid=True), ForeignKey("entries.entry_id", ondelete="CASCADE"), nullable=False, index=True)
    student_user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="not_submitted", index=True)
    # Possible string values for status: "not_submitted", "submitted_processing", "outcome_available"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # keep unique per entry+student; multiple submissions tracked separately
    __table_args__ = (UniqueConstraint('entry_id', 'student_user_id', name='uq_student_entry_state'),)

    # Relationships
    student = relationship("User", back_populates="entry_states", foreign_keys=[student_user_id], lazy="joined")
    entry = relationship("Entry", back_populates="student_states", lazy="joined")


class Submission(Base):
    __tablename__ = "submissions"

    submission_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id = Column(UUID(as_uuid=True), ForeignKey("entries.entry_id", ondelete="CASCADE"), nullable=False, index=True)
    student_user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)

    submission_title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student = relationship("User", back_populates="submissions", foreign_keys=[student_user_id], lazy="joined")
    entry = relationship("Entry", back_populates="submissions", lazy="joined")
    outcome = relationship("Outcome", uselist=False, back_populates="submission", cascade="all, delete-orphan", lazy="selectin")


class Outcome(Base):
    __tablename__ = "outcomes"

    outcome_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.submission_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    outcome_data = Column(JSON, nullable=False)
    # Example outcome_data:
    # {
    #   "feedback_text": "...",
    #   "score": 8.5,
    #   "llm_raw_response": { ... }, // Optional
    #   "llm_confidence": 0.9 // Optional
    # }
    is_llm_generated = Column(Boolean, default=True, nullable=False)

    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    submission = relationship("Submission", back_populates="outcome", lazy="joined")
