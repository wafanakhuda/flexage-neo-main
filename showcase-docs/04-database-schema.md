# Database Schema and Models

## Overview

The FlexAGE database is designed using PostgreSQL with SQLAlchemy ORM. The schema supports a flexible assessment system with multi-role users, assessment components, entries, submissions, and AI-generated outcomes.

## Database Design Principles

- **UUID Primary Keys**: All entities use UUID primary keys for security and scalability
- **Soft Relationships**: Foreign key constraints with appropriate cascade behaviors
- **Audit Trail**: Created/updated timestamps on all entities
- **JSONB Storage**: Flexible JSON storage for rubrics and outcome data
- **Indexing Strategy**: Strategic indexing on frequently queried fields
- **Role-Based Access**: User roles stored as strings for flexibility

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │  FlexAGEComp    │       │     Entry       │
│─────────────────│       │─────────────────│       │─────────────────│
│ user_id (PK)    │◄─────┐│ comp_id (PK)    │◄──────│ entry_id (PK)   │
│ username        │      ││ comp_name       │       │ entry_title     │
│ email           │      ││ general_instr.  │       │ instructions    │
│ hashed_password │      ││ created_by_uid  │───────┤ flex_age_comp_id│
│ full_name       │      ││ created_at      │       │ rubric_def.(JSON)│
│ role            │      ││ updated_at      │       │ created_by_uid  │───┐
│ is_active       │      │└─────────────────┘       │ created_at      │   │
│ created_at      │      │        │                 │ updated_at      │   │
│ updated_at      │      │        │ M:N             └─────────────────┘   │
└─────────────────┘      │        │ (enrollments)           │             │
         │                │        ▼                        │ 1:N         │
         │ 1:N            │ ┌─────────────────┐             ▼             │
         │                └─│  Enrollments    │    ┌─────────────────┐    │
         │                  │─────────────────│    │ StudentEntryState│    │
         │                  │ user_id (PK)    │    │─────────────────│    │
         │                  │ flex_age_comp_id│    │ state_id (PK)   │    │
         │                  │ enrolled_at     │    │ entry_id        │────┘
         │                  └─────────────────┘    │ student_user_id │────┐
         │                                         │ status          │    │
         │ 1:N                                     │ created_at      │    │
         ▼                                         │ updated_at      │    │
┌─────────────────┐                               └─────────────────┘    │
│   Submission    │                                        │             │
│─────────────────│                                        │ 1:N         │
│ submission_id PK│                                        ▼             │
│ entry_id        │────────────────────────────────────────┤             │
│ student_user_id │◄───────────────────────────────────────┘             │
│ submission_title│                                                      │
│ content         │                                                      │
│ submitted_at    │                                                      │
└─────────────────┘                                                      │
         │ 1:1                                                           │
         ▼                                                               │
┌─────────────────┐                                                     │
│    Outcome      │                                                     │
│─────────────────│                                                     │
│ outcome_id (PK) │                                                     │
│ submission_id   │─────────────────────────────────────────────────────┘
│ outcome_data    │ (JSONB)
│ is_llm_generated│
│ generated_at    │
└─────────────────┘
```

## Table Definitions

### 1. Users Table

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**SQLAlchemy Model:**

```python
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
    created_flex_age_comps = relationship("FlexAGEComp", back_populates="creator", foreign_keys="FlexAGEComp.created_by_user_id", lazy="selectin")
    created_entries = relationship("Entry", back_populates="creator", foreign_keys="Entry.created_by_user_id", lazy="selectin")
    enrolled_flex_age_comps = relationship("FlexAGEComp", secondary=student_flex_age_comp_enrollments, back_populates="enrolled_students", lazy="selectin")
    submissions = relationship("Submission", back_populates="student", foreign_keys="Submission.student_user_id", cascade="all, delete-orphan", lazy="selectin")
    entry_states = relationship("StudentEntryState", back_populates="student", foreign_keys="StudentEntryState.student_user_id", cascade="all, delete-orphan", lazy="selectin")
```

**Role Values:**

- `student`: Can submit entries and view feedback
- `configurator`: Can create/manage components and entries
- `admin`: Full system access including user management

### 2. FlexAGE Components Table

```sql
CREATE TABLE flex_age_comps (
    comp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comp_name VARCHAR(255) NOT NULL,
    general_instructions TEXT,
    created_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_flex_age_comps_name ON flex_age_comps(comp_name);
CREATE INDEX idx_flex_age_comps_created_by ON flex_age_comps(created_by_user_id);
```

**SQLAlchemy Model:**

```python
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
    enrolled_students = relationship("User", secondary=student_flex_age_comp_enrollments, back_populates="enrolled_flex_age_comps", lazy="selectin")
```

### 3. Student Enrollments (Association Table)

```sql
CREATE TABLE student_flex_age_comp_enrollments (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    flex_age_comp_id UUID REFERENCES flex_age_comps(comp_id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, flex_age_comp_id)
);
```

**SQLAlchemy Model:**

```python
student_flex_age_comp_enrollments = Table(
    "student_flex_age_comp_enrollments",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True),
    Column("flex_age_comp_id", UUID(as_uuid=True), ForeignKey("flex_age_comps.comp_id", ondelete="CASCADE"), primary_key=True),
    Column("enrolled_at", DateTime(timezone=True), server_default=func.now())
)
```

### 4. Entries Table

```sql
CREATE TABLE entries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flex_age_comp_id UUID NOT NULL REFERENCES flex_age_comps(comp_id) ON DELETE CASCADE,
    entry_title VARCHAR(255) NOT NULL,
    instructions TEXT,
    rubric_definition JSONB NOT NULL DEFAULT '{}',
    created_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_entries_flex_age_comp_id ON entries(flex_age_comp_id);
CREATE INDEX idx_entries_title ON entries(entry_title);
CREATE INDEX idx_entries_created_by ON entries(created_by_user_id);
```

**SQLAlchemy Model:**

```python
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
```

**Rubric Definition Structure:**

```json
{
  "criteria": [
    {
      "text": "Content Quality",
      "marks": 25
    },
    {
      "text": "Organization",
      "marks": 15
    }
  ],
  "performance_levels": [
    {
      "text": "Excellent"
    },
    {
      "text": "Good"
    },
    {
      "text": "Satisfactory"
    },
    {
      "text": "Needs Improvement"
    }
  ],
  "cell_descriptions": [
    ["Outstanding content depth", "Good content depth", "Adequate content", "Insufficient content"],
    ["Perfectly organized", "Well organized", "Somewhat organized", "Poorly organized"]
  ]
}
```

### 5. Student Entry States Table

```sql
CREATE TABLE student_entry_states (
    state_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES entries(entry_id) ON DELETE CASCADE,
    student_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'not_submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entry_id, student_user_id)
);

-- Indexes
CREATE INDEX idx_student_entry_states_entry_id ON student_entry_states(entry_id);
CREATE INDEX idx_student_entry_states_student_id ON student_entry_states(student_user_id);
CREATE INDEX idx_student_entry_states_status ON student_entry_states(status);
```

**SQLAlchemy Model:**

```python
class StudentEntryState(Base):
    __tablename__ = "student_entry_states"

    state_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id = Column(UUID(as_uuid=True), ForeignKey("entries.entry_id", ondelete="CASCADE"), nullable=False, index=True)
    student_user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="not_submitted", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Constraints
    __table_args__ = (UniqueConstraint('entry_id', 'student_user_id', name='uq_student_entry_state'),)

    # Relationships
    student = relationship("User", back_populates="entry_states", foreign_keys=[student_user_id], lazy="joined")
    entry = relationship("Entry", back_populates="student_states", lazy="joined")
```

**Status Values:**

- `not_submitted`: Student hasn't submitted anything yet
- `submitted_processing`: Submission received, AI grading in progress
- `outcome_available`: Grading complete, feedback available

### 6. Submissions Table

```sql
CREATE TABLE submissions (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES entries(entry_id) ON DELETE CASCADE,
    student_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    submission_title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_submissions_entry_id ON submissions(entry_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_user_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
```

**SQLAlchemy Model:**

```python
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
```

### 7. Outcomes Table

```sql
CREATE TABLE outcomes (
    outcome_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID UNIQUE NOT NULL REFERENCES submissions(submission_id) ON DELETE CASCADE,
    outcome_data JSONB NOT NULL,
    is_llm_generated BOOLEAN NOT NULL DEFAULT true,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_outcomes_submission_id ON outcomes(submission_id);
CREATE INDEX idx_outcomes_generated_at ON outcomes(generated_at);
CREATE INDEX idx_outcomes_is_llm_generated ON outcomes(is_llm_generated);
```

**SQLAlchemy Model:**

```python
class Outcome(Base):
    __tablename__ = "outcomes"

    outcome_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.submission_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    outcome_data = Column(JSON, nullable=False)
    is_llm_generated = Column(Boolean, default=True, nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    submission = relationship("Submission", back_populates="outcome", lazy="joined")
```

**Outcome Data Structure:**

```json
{
  "feedback_text": "<p>Excellent analysis of the topic. You demonstrated a deep understanding of the concepts and provided relevant examples.</p>",
  "score": 85.5,
  "llm_confidence": 0.92,
  "criteria_scores": {
    "Content Quality": 22,
    "Organization": 13
  },
  "llm_raw_response": {
    "model_version": "gemini-1.5-pro",
    "processing_time": 2.3,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Database Constraints and Relationships

### Foreign Key Relationships

1. **Users → FlexAGEComps** (Creator)

   - One user can create many components
   - Cascade: SET NULL (preserve components if creator deleted)
2. **Users ↔ FlexAGEComps** (Enrollment - Many-to-Many)

   - Students can enroll in multiple components
   - Components can have multiple students
   - Cascade: CASCADE (remove enrollment if user/component deleted)
3. **FlexAGEComps → Entries** (One-to-Many)

   - One component can have many entries
   - Cascade: CASCADE (delete entries if component deleted)
4. **Users → Entries** (Creator)

   - One user can create many entries
   - Cascade: SET NULL (preserve entries if creator deleted)
5. **Entries → StudentEntryStates** (One-to-Many)

   - One entry can have many student states
   - Cascade: CASCADE (delete states if entry deleted)
6. **Users → StudentEntryStates** (One-to-Many)

   - One student can have many entry states
   - Cascade: CASCADE (delete states if student deleted)
7. **Entries → Submissions** (One-to-Many)

   - One entry can have many submissions
   - Cascade: CASCADE (delete submissions if entry deleted)
8. **Users → Submissions** (One-to-Many)

   - One student can have many submissions
   - Cascade: CASCADE (delete submissions if student deleted)
9. **Submissions → Outcomes** (One-to-One)

   - Each submission can have at most one outcome
   - Cascade: CASCADE (delete outcome if submission deleted)

### Unique Constraints

1. **users.username** - Unique across the system
2. **users.email** - Unique across the system (nullable)
3. **student_entry_states(entry_id, student_user_id)** - One state per student per entry
4. **outcomes.submission_id** - One outcome per submission

### Check Constraints

```sql
-- User role validation
ALTER TABLE users ADD CONSTRAINT chk_user_role 
CHECK (role IN ('student', 'configurator', 'admin'));

-- Student entry state status validation
ALTER TABLE student_entry_states ADD CONSTRAINT chk_status 
CHECK (status IN ('not_submitted', 'submitted_processing', 'outcome_available'));

-- Active user validation
ALTER TABLE users ADD CONSTRAINT chk_is_active 
CHECK (is_active IN (true, false));
```

## Indexing Strategy

### Primary Indexes (Automatic)

- All UUID primary keys have automatic indexes

### Secondary Indexes

```sql
-- User indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- FlexAGEComp indexes
CREATE INDEX idx_flex_age_comps_name ON flex_age_comps(comp_name);
CREATE INDEX idx_flex_age_comps_created_by ON flex_age_comps(created_by_user_id);

-- Entry indexes
CREATE INDEX idx_entries_flex_age_comp_id ON entries(flex_age_comp_id);
CREATE INDEX idx_entries_title ON entries(entry_title);
CREATE INDEX idx_entries_created_by ON entries(created_by_user_id);

-- Student entry state indexes
CREATE INDEX idx_student_entry_states_entry_id ON student_entry_states(entry_id);
CREATE INDEX idx_student_entry_states_student_id ON student_entry_states(student_user_id);
CREATE INDEX idx_student_entry_states_status ON student_entry_states(status);

-- Submission indexes
CREATE INDEX idx_submissions_entry_id ON submissions(entry_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_user_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);

-- Outcome indexes
CREATE INDEX idx_outcomes_submission_id ON outcomes(submission_id);
CREATE INDEX idx_outcomes_generated_at ON outcomes(generated_at);
```

### JSONB Indexes (Future Enhancement)

```sql
-- Rubric definition indexes
CREATE INDEX idx_entries_rubric_criteria ON entries 
USING GIN ((rubric_definition->'criteria'));

-- Outcome data indexes
CREATE INDEX idx_outcomes_score ON outcomes 
USING GIN ((outcome_data->'score'));
```

## Data Migration Strategy

### Alembic Configuration

```python
# alembic/env.py
from app.models.models import Base
from app.db.database import SQLALCHEMY_DATABASE_URL

config.set_main_option("sqlalchemy.url", SQLALCHEMY_DATABASE_URL)
target_metadata = Base.metadata
```

### Sample Migration

```python
# alembic/versions/001_initial_tables.py
"""Initial tables

Revision ID: 001
Revises: 
Create Date: 2024-01-01 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create users table
    op.create_table('users',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('user_id')
    )
    op.create_index(op.f('idx_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('idx_users_username'), 'users', ['username'], unique=True)
  
    # Continue with other tables...

def downgrade():
    op.drop_index(op.f('idx_users_username'), table_name='users')
    op.drop_index(op.f('idx_users_email'), table_name='users')
    op.drop_table('users')
    # Continue with other tables...
```

## Database Optimization Considerations

### Query Optimization

1. **Efficient Joins**: Use appropriate SQLAlchemy loading strategies
2. **Selective Loading**: Only load required columns and relationships
3. **Connection Pooling**: Configure SQLAlchemy connection pool

### Storage Optimization

1. **JSON vs JSONB**: Use JSONB for better query performance
2. **Text vs VARCHAR**: Use TEXT for variable-length content
3. **Timestamp with Timezone**: Consistent time handling
4. **UUID vs SERIAL**: UUID for distributed systems and security

This database schema provides a robust foundation for the FlexAGE system with appropriate normalization, constraints, and indexing for optimal performance and data integrity.
