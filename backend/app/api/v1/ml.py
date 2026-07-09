from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.database import get_db
from app.models.models import Dataset, Model, TrainingJob, User
from app.schemas.schemas import ModelResponse, TrainingJobResponse
from app.tasks import train_model_task

router = APIRouter()


@router.get("/models", response_model=List[ModelResponse])
async def list_models(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieves a list of all trained and registered models.
    """
    query = select(Model)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/train", response_model=TrainingJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_training(
    dataset_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin", "Manager"]))
) -> Any:
    """
    Triggers the background AutoML model training pipeline on the specified dataset.
    """
    # Verify dataset exists
    query_dataset = select(Dataset).where(Dataset.id == dataset_id)
    res_dataset = await db.execute(query_dataset)
    dataset = res_dataset.scalars().first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
        
    # Check if a model record exists, or we will assign it after training
    # For now, let's create a temporary model entry in the DB
    dummy_model = Model(
        name="AutoML Pending Model",
        version="pending",
        type="regression",
        metrics={},
        filepath="pending",
        status="inactive"
    )
    db.add(dummy_model)
    await db.flush()
    
    # Create the background training job record
    job = TrainingJob(
        dataset_id=dataset.id,
        model_id=dummy_model.id,
        status="pending",
        metrics={}
    )
    db.add(job)
    await db.flush()
    
    # Trigger Celery background task
    train_model_task.delay(str(dataset.id), str(job.id))
    
    return job


@router.get("/jobs/{job_id}", response_model=TrainingJobResponse)
async def get_job_status(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Checks the status and metrics of a model training job.
    """
    query = select(TrainingJob).where(TrainingJob.id == job_id)
    result = await db.execute(query)
    job = result.scalars().first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training job not found"
        )
    return job
