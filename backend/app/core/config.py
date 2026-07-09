import os
from typing import Any, Dict, Optional
from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "CampaignOS Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super-secret-key-to-change-in-production-environments-use-openssl-rand-hex-32"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Postgres
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "campaignos"
    POSTGRES_PORT: int = 5432
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info: Any) -> Any:
        if isinstance(v, str) and v:
            return v
        
        values = info.data
        user = values.get("POSTGRES_USER")
        password = values.get("POSTGRES_PASSWORD")
        server = values.get("POSTGRES_SERVER")
        port = values.get("POSTGRES_PORT")
        db = values.get("POSTGRES_DB")
        
        # We use asyncpg driver for async SQLAlchemy sessions
        return f"postgresql+asyncpg://{user}:{password}@{server}:{port}/{db}"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    # RabbitMQ / Celery
    RABBITMQ_HOST: str = "localhost"
    RABBITMQ_PORT: int = 5672
    RABBITMQ_USER: str = "guest"
    RABBITMQ_PASSWORD: str = "guest"
    CELERY_BROKER_URL: Optional[str] = None

    @field_validator("CELERY_BROKER_URL", mode="before")
    @classmethod
    def assemble_celery_broker(cls, v: Optional[str], info: Any) -> Any:
        if isinstance(v, str) and v:
            return v
        values = info.data
        user = values.get("RABBITMQ_USER")
        password = values.get("RABBITMQ_PASSWORD")
        host = values.get("RABBITMQ_HOST")
        port = values.get("RABBITMQ_PORT")
        return f"amqp://{user}:{password}@{host}:{port}//"

    # First Superuser
    FIRST_SUPERUSER_EMAIL: str = "admin@campaignos.com"
    FIRST_SUPERUSER_PASSWORD: str = "AdminCampaignOS123!"


settings = Settings()
