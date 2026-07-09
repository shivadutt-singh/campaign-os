import datetime
import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, Boolean, JSON as SqliteJSON
from sqlalchemy.types import TypeDecorator
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class SQLJSON(TypeDecorator):
    """Custom JSON type that compiles to PostgreSQL JSONB and SQLite JSON."""
    impl = SqliteJSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(JSONB())
        return dialect.type_descriptor(SqliteJSON())


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    users: Mapped[List["User"]] = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    campaigns: Mapped[List["Campaign"]] = relationship("Campaign", back_populates="organization", cascade="all, delete-orphan")
    api_keys: Mapped[List["APIKey"]] = relationship("APIKey", back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="Viewer")  # Admin, Manager, Viewer
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    organization: Mapped[Optional[Organization]] = relationship("Organization", back_populates="users")
    sessions: Mapped[List["Session"]] = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    activities: Mapped[List["UserActivity"]] = relationship("UserActivity", back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    refresh_token: Mapped[str] = mapped_column(String(512), index=True, nullable=False)
    expires_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    user: Mapped[User] = relationship("User", back_populates="sessions")


class APIKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    scopes: Mapped[List[str]] = mapped_column(SQLJSON, default=list)  # List of scopes
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    expires_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)

    organization: Mapped[Organization] = relationship("Organization", back_populates="api_keys")


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, active, paused, completed
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    total_budget: Mapped[float] = mapped_column(Float, default=0.0)
    start_date: Mapped[Optional[datetime.date]] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[Optional[datetime.date]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    organization: Mapped[Organization] = relationship("Organization", back_populates="campaigns")
    channels: Mapped[List["Channel"]] = relationship("Channel", back_populates="campaign", cascade="all, delete-orphan")
    metrics: Mapped[List["CampaignMetric"]] = relationship("CampaignMetric", back_populates="campaign", cascade="all, delete-orphan")
    predictions: Mapped[List["Prediction"]] = relationship("Prediction", back_populates="campaign", cascade="all, delete-orphan")
    optimization_runs: Mapped[List["OptimizationRun"]] = relationship("OptimizationRun", back_populates="campaign", cascade="all, delete-orphan")
    simulation_runs: Mapped[List["SimulationRun"]] = relationship("SimulationRun", back_populates="campaign", cascade="all, delete-orphan")
    insights: Mapped[List["Insight"]] = relationship("Insight", back_populates="campaign", cascade="all, delete-orphan")
    recommendations: Mapped[List["Recommendation"]] = relationship("Recommendation", back_populates="campaign", cascade="all, delete-orphan")


class Channel(Base):
    __tablename__ = "channels"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # google_ads, meta_ads, bing_ads, etc.
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    campaign: Mapped[Campaign] = relationship("Campaign", back_populates="channels")


class CampaignMetric(Base):
    __tablename__ = "campaign_metrics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    channel: Mapped[str] = mapped_column(String(100), nullable=False)
    spend: Mapped[float] = mapped_column(Float, default=0.0)
    revenue: Mapped[float] = mapped_column(Float, default=0.0)
    clicks: Mapped[int] = mapped_column(Integer, default=0)
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    conversions: Mapped[float] = mapped_column(Float, default=0.0)
    date: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    campaign: Mapped[Campaign] = relationship("Campaign", back_populates="metrics")


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    target_date: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    predicted_revenue: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_roi: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_ctr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    predicted_cpa: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0)
    model_version: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    campaign: Mapped[Campaign] = relationship("Campaign", back_populates="predictions")


class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    target_revenue: Mapped[float] = mapped_column(Float, nullable=False)
    recommended_budget: Mapped[float] = mapped_column(Float, nullable=False)
    allocations: Mapped[Dict[str, Any]] = mapped_column(SQLJSON, default=dict)  # JSON structure of allocations
    saturation_warning: Mapped[bool] = mapped_column(Boolean, default=False)
    warning_message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    campaign: Mapped[Optional[Campaign]] = relationship("Campaign", back_populates="optimization_runs")


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    budget_payload: Mapped[Dict[str, Any]] = mapped_column(SQLJSON, default=dict)
    simulated_revenue: Mapped[float] = mapped_column(Float, default=0.0)
    simulated_roi: Mapped[float] = mapped_column(Float, default=0.0)
    daily_projections: Mapped[List[Dict[str, Any]]] = mapped_column(SQLJSON, default=list)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    campaign: Mapped[Optional[Campaign]] = relationship("Campaign", back_populates="simulation_runs")


class Insight(Base):
    __tablename__ = "insights"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)  # anomaly, performance, growth
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(50), default="info")  # info, warning, critical
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    campaign: Mapped[Campaign] = relationship("Campaign", back_populates="insights")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)
    impact_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    campaign: Mapped[Campaign] = relationship("Campaign", back_populates="recommendations")


class Model(Base):
    __tablename__ = "models"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)  # regression, forecasting, etc.
    metrics: Mapped[Dict[str, Any]] = mapped_column(SQLJSON, default=dict)
    filepath: Mapped[str] = mapped_column(String(512), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="inactive")  # active, inactive, archived
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    training_jobs: Mapped[List["TrainingJob"]] = relationship("TrainingJob", back_populates="model")


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    filepath: Mapped[str] = mapped_column(String(512), nullable=False)
    rows_count: Mapped[int] = mapped_column(Integer, default=0)
    feature_schema: Mapped[Dict[str, Any]] = mapped_column(SQLJSON, default=dict)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    training_jobs: Mapped[List["TrainingJob"]] = relationship("TrainingJob", back_populates="dataset")


class TrainingJob(Base):
    __tablename__ = "training_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    model_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("models.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, training, completed, failed
    metrics: Mapped[Dict[str, Any]] = mapped_column(SQLJSON, default=dict)
    started_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)

    dataset: Mapped[Dataset] = relationship("Dataset", back_populates="training_jobs")
    model: Mapped[Model] = relationship("Model", back_populates="training_jobs")


class InferenceLog(Base):
    __tablename__ = "inference_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("models.id", ondelete="CASCADE"), nullable=False)
    input_payload: Mapped[Dict[str, Any]] = mapped_column(SQLJSON, default=dict)
    output_payload: Mapped[Dict[str, Any]] = mapped_column(SQLJSON, default=dict)
    latency_ms: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    user: Mapped[Optional[User]] = relationship("User", back_populates="audit_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    user: Mapped[User] = relationship("User", back_populates="notifications")


class SystemLog(Base):
    __tablename__ = "system_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    level: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    module: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    value: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)


class UserActivity(Base):
    __tablename__ = "user_activities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    activity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[Dict[str, Any]] = mapped_column(SQLJSON, default=dict)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    user: Mapped[User] = relationship("User", back_populates="activities")


class PromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    template: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)


class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    hyperparameters: Mapped[Dict[str, Any]] = mapped_column(SQLJSON, default=dict)
    metrics: Mapped[Dict[str, Any]] = mapped_column(SQLJSON, default=dict)
    dataset_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True)
    model_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("models.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)


class FeatureStore(Base):
    __tablename__ = "feature_store"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    ctr: Mapped[float] = mapped_column(Float, default=0.0)
    cpc: Mapped[float] = mapped_column(Float, default=0.0)
    cpa: Mapped[float] = mapped_column(Float, default=0.0)
    roas: Mapped[float] = mapped_column(Float, default=0.0)
    moving_average_7d: Mapped[float] = mapped_column(Float, default=0.0)
    moving_average_30d: Mapped[float] = mapped_column(Float, default=0.0)
    weekly_trend: Mapped[float] = mapped_column(Float, default=0.0)
    daily_trend: Mapped[float] = mapped_column(Float, default=0.0)
    seasonality: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
