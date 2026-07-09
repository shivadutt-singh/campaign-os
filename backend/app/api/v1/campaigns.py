from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.database import get_db
from app.models.models import Campaign, SimulationRun, User
from app.repositories.entities import campaign_repo
from app.schemas.schemas import CampaignCreate, CampaignResponse, CampaignUpdate

router = APIRouter()


@router.post("/", response_model=CampaignResponse)
async def create_campaign(
    campaign_in: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin", "Manager"])),
) -> Any:
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not associated with any organization",
        )
    campaign_data = campaign_in.model_dump()
    campaign_data["organization_id"] = current_user.organization_id
    
    campaign = await campaign_repo.create(db, obj_in=campaign_data)
    return campaign


@router.get("/", response_model=List[CampaignResponse])
async def list_campaigns(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if not current_user.organization_id:
        return []
    campaigns = await campaign_repo.get_multi_by_org(
        db, organization_id=current_user.organization_id, skip=skip, limit=limit
    )
    return campaigns


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    campaign = await campaign_repo.get(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if campaign.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return campaign


@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: UUID,
    campaign_in: CampaignUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin", "Manager"])),
) -> Any:
    campaign = await campaign_repo.get(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if campaign.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
        
    campaign = await campaign_repo.update(db, db_obj=campaign, obj_in=campaign_in)
    return campaign


@router.delete("/{campaign_id}", response_model=CampaignResponse)
async def delete_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin"])),
) -> Any:
    campaign = await campaign_repo.get(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if campaign.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
        
    await campaign_repo.remove(db, id=campaign_id)
    return campaign


# Backward compatible Next.js proxy route for /api/campaigns/save
@router.post("/save")
async def save_campaign_session(
    payload: dict,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Saves a campaign session (simulation run payload) in the database.
    Payload shape: { budgets, projectedRevenue, roi }
    """
    try:
        budgets = payload.get("budgets", {})
        projected_rev = payload.get("projectedRevenue", 0.0)
        roi = payload.get("roi", 0.0)
        
        sim_run = SimulationRun(
            budget_payload=budgets,
            simulated_revenue=float(projected_rev),
            simulated_roi=float(roi),
            daily_projections=[]
        )
        db.add(sim_run)
        await db.flush()
        
        return {"success": True, "id": str(sim_run.id)}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save campaign session: {str(e)}"
        )
