"""Authentication API."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import User
from ..schemas.user import UserCreate, UserLogin, UserResponse, Token
from ..core.security import verify_password, get_password_hash, create_access_token
from ..core.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/auth", tags=["auth"])


def user_to_response(user: User) -> UserResponse:
    """Convert User model to response schema."""
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        address=user.address,
        city=user.city,
        pincode=user.pincode,
        role=user.role,
        latitude=user.latitude,
        longitude=user.longitude,
        is_active=bool(user.is_active),
        created_at=user.created_at
    )


@router.post("/register", response_model=Token)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register new user (customer or tailor)."""
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        phone=data.phone,
        address=data.address,
        city=data.city,
        pincode=data.pincode,
        role=data.role or "customer"
    )
    db.add(user)
    await db.flush()
    
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return Token(access_token=token, user=user_to_response(user))


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login and get JWT token."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is inactive")
    
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return Token(access_token=token, user=user_to_response(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return user_to_response(current_user)


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all users (admin only)."""
    result = await db.execute(select(User).order_by(User.id))
    return [user_to_response(u) for u in result.scalars().all()]


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a user (admin only). Cannot delete self."""
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.flush()
