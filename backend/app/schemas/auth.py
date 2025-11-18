import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.models import UserRoleEnum

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

# User schemas
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None  # Changed from EmailStr to str for development flexibility
    full_name: Optional[str] = None
    role: UserRoleEnum = UserRoleEnum.STUDENT
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None  # Changed from EmailStr to str for development flexibility
    full_name: Optional[str] = None
    role: Optional[UserRoleEnum] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserInDB(UserBase):
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserResponse(UserInDB):
    pass

class UserLogin(BaseModel):
    username: str
    password: str

# Enrollment schemas
class StudentEnrollmentCreate(BaseModel):
    student_user_id: uuid.UUID
    flex_age_comp_id: uuid.UUID

class StudentEnrollmentResponse(BaseModel):
    user_id: uuid.UUID
    flex_age_comp_id: uuid.UUID
    enrolled_at: datetime
    
    class Config:
        from_attributes = True
