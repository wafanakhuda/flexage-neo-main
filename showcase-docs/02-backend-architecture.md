# Backend Architecture

## Overview

The FlexAGE backend is built using FastAPI, a modern Python web framework that provides automatic API documentation, type hints, and high performance. The architecture follows a layered approach with clear separation of concerns.

## Project Structure

```
backend/
├── alembic/                 # Database migration management
│   ├── env.py              # Alembic environment configuration
│   └── versions/           # Migration files
├── app/
│   ├── __init__.py
│   ├── main.py             # FastAPI application entry point
│   ├── api/                # API routing layer
│   │   ├── api.py          # Main API router
│   │   └── endpoints/      # Individual endpoint modules
│   │       ├── auth.py     # Authentication endpoints
│   │       ├── flexagecomps.py  # FlexAGE Component management
│   │       ├── entries.py  # Entry management
│   │       ├── submissions.py  # Submission handling
│   │       ├── outcomes.py # Outcome management
│   │       └── student.py  # Student-specific endpoints
│   ├── core/               # Core functionality
│   │   ├── config.py       # Application configuration
│   │   ├── security.py     # Authentication & authorization
│   │   ├── deps.py         # Dependency injection
│   │   ├── constants.py    # Application constants
│   │   ├── llm_evaluator.py    # AI grading logic
│   │   ├── llm_simulator.py    # AI simulation/testing
│   │   └── background_tasks.py # Async task handling
│   ├── crud/               # Database operations
│   │   └── crud.py         # CRUD operations for all models
│   ├── db/                 # Database configuration
│   │   ├── database.py     # SQLAlchemy setup
│   │   └── init_db.py      # Database initialization
│   ├── models/             # SQLAlchemy models
│   │   └── models.py       # All database models
│   └── schemas/            # Pydantic schemas
│       ├── schemas.py      # API request/response models
│       └── auth.py         # Authentication schemas
├── prompts/                # AI prompt templates
│   └── evaluation_prompt.txt
├── requirements.txt        # Python dependencies
├── alembic.ini            # Alembic configuration
└── README.md              # Backend documentation
```

## Core Components

### 1. Application Entry Point (`main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api import api_router
from app.core.config import settings

# Create FastAPI app
app = FastAPI(
    title="FlexAGE API",
    description="API for FlexAGE - Flexible Assessment Grading Engine",
    version="0.1.0",
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=7200,
)

# Include API router
app.include_router(api_router)
```

### 2. Database Models (`models.py`)

The application uses SQLAlchemy ORM with the following key models:

#### User Model
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
```

#### FlexAGEComp Model
```python
class FlexAGEComp(Base):
    __tablename__ = "flex_age_comps"
    
    comp_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    comp_name = Column(String(255), nullable=False, index=True)
    general_instructions = Column(Text)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

#### Entry Model
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
```

#### Submission Model
```python
class Submission(Base):
    __tablename__ = "submissions"
    
    submission_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id = Column(UUID(as_uuid=True), ForeignKey("entries.entry_id", ondelete="CASCADE"), nullable=False, index=True)
    student_user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    submission_title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
```

#### Outcome Model
```python
class Outcome(Base):
    __tablename__ = "outcomes"
    
    outcome_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.submission_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    outcome_data = Column(JSON, nullable=False)
    is_llm_generated = Column(Boolean, default=True, nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
```

#### StudentEntryState Model
```python
class StudentEntryState(Base):
    __tablename__ = "student_entry_states"
    
    state_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id = Column(UUID(as_uuid=True), ForeignKey("entries.entry_id", ondelete="CASCADE"), nullable=False, index=True)
    student_user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="not_submitted", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

### 3. Pydantic Schemas

The application uses Pydantic for request/response validation and serialization:

#### Base Schemas
```python
class FlexAGECompBase(BaseModel):
    comp_name: str
    general_instructions: Optional[str] = None

class FlexAGECompCreate(FlexAGECompBase):
    pass

class FlexAGECompUpdate(FlexAGECompBase):
    pass

class FlexAGECompResponse(FlexAGECompInDB):
    pass
```

#### Complex Response Schemas
```python
class EntryWithStudentStateWithSubmission(EntryResponse):
    student_state: Optional[StudentEntryStateWithSubmission] = None

class SubmissionWithOutcome(SubmissionResponse):
    outcome: Optional[OutcomeResponse] = None
```

### 4. CRUD Operations

Centralized database operations in `crud.py`:

```python
# FlexAGEComp CRUD operations
def create_flexagecomp(db: Session, flexagecomp: schemas.FlexAGECompCreate, creator_user_id: Optional[uuid.UUID] = None) -> FlexAGEComp:
    db_flexagecomp = FlexAGEComp(
        comp_name=flexagecomp.comp_name,
        general_instructions=flexagecomp.general_instructions,
        created_by_user_id=creator_user_id
    )
    db.add(db_flexagecomp)
    db.commit()
    db.refresh(db_flexagecomp)
    return db_flexagecomp

def get_flexagecomp(db: Session, comp_id: uuid.UUID) -> Optional[FlexAGEComp]:
    return db.query(FlexAGEComp).filter(FlexAGEComp.comp_id == comp_id).first()

def get_flexagecomps(db: Session, skip: int = 0, limit: int = 100) -> List[FlexAGEComp]:
    return db.query(FlexAGEComp).offset(skip).limit(limit).all()
```

### 5. Authentication & Authorization

#### JWT Token Implementation
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

#### Role-Based Dependencies
```python
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
    
    user = crud.get_user_by_id(db, user_id=uuid.UUID(token_data.user_id))
    if user is None:
        raise credentials_exception
    return user

def get_current_student(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current user if they are a student."""
    if current_user.role != UserRoleEnum.STUDENT.value:
        raise HTTPException(
            status_code=403,
            detail="Operation requires student role"
        )
    return current_user

def get_current_configurator(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current user if they are a configurator or admin."""
    if current_user.role not in [UserRoleEnum.CONFIGURATOR.value, UserRoleEnum.ADMIN.value]:
        raise HTTPException(
            status_code=403,
            detail="Operation requires configurator or admin role"
        )
    return current_user
```

### 6. API Endpoints Structure

#### Authentication Endpoints (`auth.py`)
- `POST /api/auth/login` - Form-based login
- `POST /api/auth/login/json` - JSON-based login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/register` - Create new user (admin/configurator only)
- `GET /api/auth/users` - List users (admin/configurator only)
- `POST /api/auth/enroll` - Enroll student in component
- `DELETE /api/auth/enroll` - Unenroll student from component

#### FlexAGE Component Endpoints (`flexagecomps.py`)
- `POST /api/configure/flexagecomps/` - Create component
- `GET /api/configure/flexagecomps/` - List components
- `GET /api/configure/flexagecomps/{comp_id}` - Get component
- `PUT /api/configure/flexagecomps/{comp_id}` - Update component
- `DELETE /api/configure/flexagecomps/{comp_id}` - Delete component
- `GET /api/configure/flexagecomps/{comp_id}/entries` - Get component entries
- `GET /api/configure/flexagecomps/{comp_id}/students` - Get enrolled students

#### Entry Endpoints (`entries.py`)
- `POST /api/configure/entries/` - Create entry
- `GET /api/configure/entries/` - List entries
- `GET /api/configure/entries/{entry_id}` - Get entry
- `PUT /api/configure/entries/{entry_id}` - Update entry
- `DELETE /api/configure/entries/{entry_id}` - Delete entry
- `GET /api/configure/entries/{entry_id}/submissions` - Get entry submissions
- `GET /api/configure/entries/{entry_id}/student_states` - Get student states

#### Student Endpoints (`student.py`)
- `GET /api/student/flexagecomps` - Get enrolled components
- `GET /api/student/flexagecomps/{comp_id}/entries` - Get component entries for student
- `GET /api/student/entries/{entry_id}` - Get entry for student
- `POST /api/student/entries/{entry_id}/submit` - Submit entry response
- `GET /api/student/entries/{entry_id}/submissions` - Get student's submissions for entry

#### Submission Endpoints (`submissions.py`)
- `GET /api/configure/submissions/` - List submissions (configurator)
- `GET /api/configure/submissions/{submission_id}` - Get submission
- `POST /api/configure/submissions/{submission_id}/generate-outcome` - Generate AI outcome

#### Outcome Endpoints (`outcomes.py`)
- `GET /api/configure/outcomes/{outcome_id}` - Get outcome
- `PUT /api/configure/outcomes/{outcome_id}` - Update outcome

### 7. AI Integration

#### LLM Evaluator
```python
class LLMEvaluator:
    def __init__(self):
        self.model = GenerativeModel("gemini-1.5-pro")
    
    async def evaluate_submission(
        self,
        submission_content: str,
        rubric_definition: dict,
        entry_instructions: str
    ) -> dict:
        """Evaluate a submission using the LLM."""
        
        # Construct evaluation prompt
        prompt = self._build_evaluation_prompt(
            submission_content, rubric_definition, entry_instructions
        )
        
        # Generate response
        response = await self.model.generate_content_async(prompt)
        
        # Parse and structure response
        return self._parse_evaluation_response(response.text)
```

### 8. Database Configuration

#### SQLAlchemy Setup
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### Migration Management
Using Alembic for database migrations:
```python
# alembic/env.py
from app.models.models import Base
from app.db.database import SQLALCHEMY_DATABASE_URL

config.set_main_option("sqlalchemy.url", SQLALCHEMY_DATABASE_URL)
target_metadata = Base.metadata
```

### 9. Error Handling

#### HTTP Exception Handling
```python
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
```

#### Validation Error Handling
Pydantic automatically handles request validation and returns structured error responses.

### 10. Background Tasks

#### Async Processing
```python
@router.post("/{entry_id}/submit")
def submit_entry(
    entry_id: uuid.UUID,
    submission: schemas.StudentSubmissionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    # Create submission
    db_submission = crud.create_submission(db=db, submission=submission_data)
    
    # Queue background task for AI grading
    background_tasks.add_task(
        process_submission_for_grading,
        submission_id=db_submission.submission_id
    )
    
    return db_submission
```

### 11. Configuration Management

#### Settings with Pydantic
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DATABASE_URL: str
    GOOGLE_AI_API_KEY: str
    
    class Config:
        env_file = ".env"

settings = Settings()
```

## Performance Optimizations

### Database Query Optimization
- Strategic use of SQLAlchemy lazy loading (`lazy="selectin"`, `lazy="joined"`)
- Database indexing on frequently queried fields
- Efficient relationship loading strategies

### API Response Optimization
- Pydantic model optimization for serialization
- Selective field inclusion in responses
- Pagination for large data sets

### Caching Strategies
- SQLAlchemy session management
- Connection pooling
- Query result caching (future enhancement)

## Security Measures

### Input Validation
- Pydantic schema validation for all inputs
- SQLAlchemy ORM prevents SQL injection
- UUID usage for all primary keys

### Authentication Security
- JWT with expiration
- BCrypt password hashing
- Secure token validation

### Authorization Controls
- Role-based access control
- Resource ownership validation
- API endpoint protection

This architecture provides a solid foundation for the FlexAGE system with clear separation of concerns, robust security, and scalable design patterns.
