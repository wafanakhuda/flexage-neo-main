from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.core.security import verify_token
from app.db.database import get_db
from app.crud import crud
from app.models.models import User, UserRoleEnum
from app.schemas.auth import TokenData

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(credentials.credentials)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except Exception:
        raise credentials_exception
    
    user = crud.get_user_by_id(db, user_id=uuid.UUID(token_data.user_id))
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_role(*allowed_roles: UserRoleEnum):
    """Dependency factory to require specific roles."""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user
    return role_checker

def get_current_student(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current user if they are a student."""
    if current_user.role != UserRoleEnum.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required"
        )
    return current_user

def get_current_configurator(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current user if they are a configurator or admin."""
    if current_user.role not in [UserRoleEnum.CONFIGURATOR, UserRoleEnum.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Configurator access required"
        )
    return current_user
