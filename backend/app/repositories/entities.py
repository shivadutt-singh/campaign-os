from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import APIKey, Campaign, Organization, User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        query = select(User).filter(User.email == email)
        result = await db.execute(query)
        return result.scalars().first()


class OrganizationRepository(BaseRepository[Organization]):
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Organization]:
        query = select(Organization).filter(Organization.name == name)
        result = await db.execute(query)
        return result.scalars().first()


class CampaignRepository(BaseRepository[Campaign]):
    async def get_multi_by_org(
        self, db: AsyncSession, *, organization_id: str, skip: int = 0, limit: int = 100
    ) -> List[Campaign]:
        query = (
            select(Campaign)
            .filter(Campaign.organization_id == organization_id)
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return list(result.scalars().all())


class APIKeyRepository(BaseRepository[APIKey]):
    async def get_by_hash(self, db: AsyncSession, key_hash: str) -> Optional[APIKey]:
        query = select(APIKey).filter(APIKey.key_hash == key_hash)
        result = await db.execute(query)
        return result.scalars().first()


user_repo = UserRepository(User)
org_repo = OrganizationRepository(Organization)
campaign_repo = CampaignRepository(Campaign)
api_key_repo = APIKeyRepository(APIKey)
