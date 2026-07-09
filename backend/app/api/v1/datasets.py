import csv
import os
import shutil
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.database import get_db
from app.models.models import Dataset, User
from app.schemas.schemas import DatasetResponse

router = APIRouter()

# Resolve datasets directory inside ai-ml
DATASETS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../../../ai-ml/datasets")
)


@router.post("/upload", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin", "Manager"])),
) -> Any:
    """
    Saves and parses an uploaded CSV dataset for ML training.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported."
        )
        
    os.makedirs(DATASETS_DIR, exist_ok=True)
    file_path = os.path.join(DATASETS_DIR, file.filename)
    
    # Write to local file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )
        
    # Analyze the CSV file structure and size
    try:
        row_count = 0
        headers = []
        with open(file_path, mode="r", encoding="utf-8") as f:
            reader = csv.reader(f)
            headers = next(reader, [])
            for _ in reader:
                row_count += 1
                
        # Generate feature schema mapping column names to generic data types
        feature_schema = {h: "numeric" for h in headers}
        
        # Log to Database
        db_dataset = Dataset(
            name=file.filename,
            filepath=file_path,
            rows_count=row_count,
            feature_schema=feature_schema
        )
        db.add(db_dataset)
        await db.flush()
        
        return db_dataset
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"CSV parsing error: {str(e)}"
        )


@router.get("/", response_model=List[DatasetResponse])
async def list_datasets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Lists all available datasets.
    """
    from sqlalchemy import select
    query = select(Dataset)
    result = await db.execute(query)
    return result.scalars().all()
