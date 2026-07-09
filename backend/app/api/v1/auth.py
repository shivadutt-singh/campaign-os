from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import APIKeyCreate, APIKeyResponse, Token, UserCreate, UserResponse
from app.services.auth_service import auth_service

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    db: AsyncSession = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = await auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    return await auth_service.create_tokens_for_user(db, user)


@router.post("/register", response_model=UserResponse)
async def register(
    user_in: UserCreate, db: AsyncSession = Depends(get_db)
) -> Any:
    try:
        user = await auth_service.register_user(db, user_in)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/refresh", response_model=Token)
async def refresh(
    refresh_token: str = Body(..., embed=True), db: AsyncSession = Depends(get_db)
) -> Any:
    try:
        return await auth_service.refresh_access_token(db, refresh_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(deps.get_current_user)) -> Any:
    return current_user


@router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(
    key_in: APIKeyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin", "Manager"])),
) -> Any:
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not associated with any organization",
        )
    key, raw = await auth_service.generate_api_key(
        db,
        organization_id=current_user.organization_id,
        name=key_in.name,
        scopes=key_in.scopes,
        expires_days=key_in.expires_in_days,
    )
    
    # Pack the raw token in the response (shown only once)
    resp = APIKeyResponse.model_validate(key)
    resp.api_key = raw
    return resp


@router.get("/api-keys", response_model=List[APIKeyResponse])
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin", "Manager"])),
) -> Any:
    from sqlalchemy import select
    if not current_user.organization_id:
        return []
    query = select(deps.APIKey).filter(deps.APIKey.organization_id == current_user.organization_id)
    result = await db.execute(query)
    keys = result.scalars().all()
    return keys
