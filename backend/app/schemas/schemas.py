from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ----------------------------------------------------
# Base Config
# ----------------------------------------------------
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


# ----------------------------------------------------
# Token & Auth Schemas
# ----------------------------------------------------
class Token(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseSchema):
    sub: str
    exp: int
    type: str


# ----------------------------------------------------
# User Schemas
# ----------------------------------------------------
class UserBase(BaseSchema):
    email: EmailStr
    role: str = "Viewer"  # Admin, Manager, Viewer
    is_active: bool = True


class UserCreate(UserBase):
    password: str
    organization_id: Optional[UUID] = None


class UserUpdate(BaseSchema):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    organization_id: Optional[UUID] = None
    created_at: datetime


class UserLogin(BaseSchema):
    username: EmailStr  # FastAPI OAuth2 expects 'username'
    password: str


# ----------------------------------------------------
# Organization Schemas
# ----------------------------------------------------
class OrganizationBase(BaseSchema):
    name: str


class OrganizationCreate(OrganizationBase):
    """Schema for organization creation operations."""


class OrganizationResponse(OrganizationBase):
    id: UUID
    created_at: datetime


# ----------------------------------------------------
# Campaign Schemas
# ----------------------------------------------------
class CampaignBase(BaseSchema):
    name: str
    status: str = "draft"  # draft, active, paused, completed
    total_budget: float = 0.0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CampaignCreate(CampaignBase):
    """Schema for campaign creation operations."""


class CampaignUpdate(BaseSchema):
    name: Optional[str] = None
    status: Optional[str] = None
    total_budget: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CampaignResponse(CampaignBase):
    id: UUID
    organization_id: UUID
    created_at: datetime


# ----------------------------------------------------
# API Key Schemas
# ----------------------------------------------------
class APIKeyCreate(BaseSchema):
    name: str
    scopes: List[str] = []
    expires_in_days: Optional[int] = None


class APIKeyResponse(BaseSchema):
    id: UUID
    name: str
    scopes: List[str]
    created_at: datetime
    expires_at: Optional[datetime] = None
    api_key: Optional[str] = None  # Returned ONLY on creation


# ----------------------------------------------------
# Optimization Schemas
# ----------------------------------------------------
class OptimizeRequest(BaseModel):
    targetRevenue: float = Field(..., gt=0)


class OptimizeResponse(BaseModel):
    target_revenue: int
    total_recommended_budget: int
    allocations: Dict[str, int]
    saturation_warning: bool
    warning_message: str


# ----------------------------------------------------
# Simulation Schemas
# ----------------------------------------------------
class SimulationRow(BaseModel):
    Date: str
    Channel: str
    Expected_Revenue: float
    Best_Case: float
    Worst_Case: float
    AI_Insight: str


# ----------------------------------------------------
# Dataset Schemas
# ----------------------------------------------------
class DatasetResponse(BaseSchema):
    id: UUID
    name: str
    filepath: str
    rows_count: int
    feature_schema: Dict[str, Any]
    created_at: datetime


# ----------------------------------------------------
# ML Model & Training Schemas
# ----------------------------------------------------
class ModelResponse(BaseSchema):
    id: UUID
    name: str
    version: str
    type: str
    metrics: Dict[str, Any]
    filepath: str
    status: str
    created_at: datetime


class TrainingJobResponse(BaseSchema):
    id: UUID
    dataset_id: UUID
    model_id: UUID
    status: str
    metrics: Dict[str, Any]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
