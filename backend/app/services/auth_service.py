import datetime
import hashlib
import secrets
from typing import List, Optional, Tuple
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.models import APIKey, Organization, Session, User
from app.repositories.entities import api_key_repo, org_repo, user_repo
from app.schemas.schemas import Token, UserCreate


class AuthService:
    @staticmethod
    def _hash_api_key(key: str) -> str:
        return hashlib.sha256(key.encode("utf-8")).hexdigest()

    async def authenticate_user(
        self, db: AsyncSession, email: str, password: str
    ) -> Optional[User]:
        user = await user_repo.get_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def register_user(
        self, db: AsyncSession, user_in: UserCreate
    ) -> User:
        # Check if email exists
        existing_user = await user_repo.get_by_email(db, user_in.email)
        if existing_user:
            raise ValueError("Email already registered")

        # Resolve organization
        org_id = user_in.organization_id
        if not org_id:
            # Create a default organization for this user
            org = await org_repo.get_by_name(db, f"{user_in.email.split('@')[0]}'s Organization")
            if not org:
                org = await org_repo.create(db, obj_in={"name": f"{user_in.email.split('@')[0]}'s Organization"})
            org_id = org.id

        hashed_password = get_password_hash(user_in.password)
        user_data = {
            "email": user_in.email,
            "hashed_password": hashed_password,
            "role": user_in.role,
            "organization_id": org_id,
            "is_active": True,
        }
        user = await user_repo.create(db, obj_in=user_data)
        return user

    async def create_tokens_for_user(
        self, db: AsyncSession, user: User
    ) -> Token:
        access_token = create_access_token(subject=user.id)
        refresh_token = create_refresh_token(subject=user.id)

        # Save session
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        session_data = {
            "user_id": user.id,
            "refresh_token": refresh_token,
            "expires_at": expires_at,
        }
        
        # In a real app we might delete older sessions first, let's keep it simple
        from sqlalchemy import delete
        await db.execute(delete(Session).where(Session.user_id == user.id))
        
        # Create session
        new_session = Session(**session_data)
        db.add(new_session)
        await db.flush()

        return Token(access_token=access_token, refresh_token=refresh_token)

    async def refresh_access_token(
        self, db: AsyncSession, refresh_token: str
    ) -> Token:
        try:
            payload = decode_token(refresh_token)
            user_id = payload.get("sub")
            token_type = payload.get("type")
            if not user_id or token_type != "refresh":
                raise ValueError("Invalid refresh token")
        except JWTError:
            raise ValueError("Invalid refresh token")

        # Verify session in DB
        from sqlalchemy import select
        query = select(Session).filter(
            Session.refresh_token == refresh_token,
            Session.expires_at > datetime.datetime.utcnow(),
        )
        result = await db.execute(query)
        session = result.scalars().first()
        if not session:
            raise ValueError("Refresh token expired or revoked")

        user = await user_repo.get(db, session.user_id)
        if not user or not user.is_active:
            raise ValueError("User not active")

        # Generate new tokens
        return await self.create_tokens_for_user(db, user)

    async def generate_api_key(
        self, db: AsyncSession, organization_id: str, name: str, scopes: List[str] = [], expires_days: Optional[int] = None
    ) -> Tuple[APIKey, str]:
        # Generate random API key prefix + secret
        key_prefix = "cop_"
        key_secret = secrets.token_urlsafe(32)
        raw_key = f"{key_prefix}{key_secret}"
        
        key_hash = self._hash_api_key(raw_key)
        
        expires_at = None
        if expires_days:
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=expires_days)

        api_key_data = {
            "organization_id": organization_id,
            "key_hash": key_hash,
            "name": name,
            "scopes": scopes,
            "expires_at": expires_at,
        }
        
        api_key = await api_key_repo.create(db, obj_in=api_key_data)
        return api_key, raw_key

    async def validate_api_key(self, db: AsyncSession, raw_key: str) -> Optional[APIKey]:
        key_hash = self._hash_api_key(raw_key)
        api_key = await api_key_repo.get_by_hash(db, key_hash)
        
        if not api_key:
            return None
            
        if api_key.expires_at and api_key.expires_at < datetime.datetime.utcnow():
            return None
            
        return api_key

    async def seed_first_superuser(self, db: AsyncSession) -> None:
        # Create default organization
        org = await org_repo.get_by_name(db, "Google DeepMind")
        if not org:
            org = await org_repo.create(db, obj_in={"name": "Google DeepMind"})

        admin = await user_repo.get_by_email(db, settings.FIRST_SUPERUSER_EMAIL)
        if not admin:
            admin_in = UserCreate(
                email=settings.FIRST_SUPERUSER_EMAIL,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                role="Admin",
                organization_id=org.id,
            )
            await self.register_user(db, admin_in)


auth_service = AuthService()
