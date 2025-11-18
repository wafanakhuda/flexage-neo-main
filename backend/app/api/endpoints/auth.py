from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from app.core.config import settings
from app.core.security import create_access_token
from app.core.deps import get_current_configurator, get_current_active_user
from app.db.database import get_db
from app.crud import crud
from app.schemas.auth import Token, UserCreate, UserResponse, UserLogin, StudentEnrollmentCreate
from app.models.models import UserRoleEnum

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate user and return access token."""
    user = crud.authenticate_user(db, username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.user_id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login/json", response_model=Token)
def login_json(user_login: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with JSON payload and return access token."""
    user = crud.authenticate_user(db, username=user_login.username, password=user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.user_id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user

@router.post("/register", response_model=UserResponse)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_configurator)  # Only configurators can create users
):
    """Create a new user (configurator only)."""
    # Check if user already exists
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    if user.email:
        db_user = crud.get_user_by_email(db, email=user.email)
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    return crud.create_user(db=db, user=user)

@router.get("/users", response_model=List[UserResponse])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_configurator)
):
    """Get list of users (configurator only)."""
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@router.post("/enroll")
def enroll_student(
    enrollment: StudentEnrollmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_configurator)
):
    """Enroll a student in a FlexAGEComp (configurator only)."""
    # Verify student exists and is a student
    student = crud.get_user_by_id(db, enrollment.student_user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if student.role != UserRoleEnum.STUDENT:
        raise HTTPException(status_code=400, detail="User is not a student")
    
    # Verify FlexAGEComp exists
    flexagecomp = crud.get_flexagecomp(db, enrollment.flex_age_comp_id)
    if not flexagecomp:
        raise HTTPException(status_code=404, detail="FlexAGEComp not found")
    
    success = crud.enroll_student_in_comp(db, enrollment.student_user_id, enrollment.flex_age_comp_id)
    if not success:
        raise HTTPException(status_code=400, detail="Student already enrolled in this FlexAGEComp")
    
    return {"message": "Student enrolled successfully"}

@router.delete("/enroll")
def unenroll_student(
    enrollment: StudentEnrollmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_configurator)
):
    """Unenroll a student from a FlexAGEComp (configurator only)."""
    success = crud.unenroll_student_from_comp(db, enrollment.student_user_id, enrollment.flex_age_comp_id)
    if not success:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    return {"message": "Student unenrolled successfully"}
