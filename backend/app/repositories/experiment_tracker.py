import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Experiment


class ExperimentTrackerRepository:
    """
    Handles logging and retrieval of hyperparameter tuning experiments and model metrics.
    """

    @staticmethod
    async def log_experiment(
        db: AsyncSession,
        name: str,
        hyperparameters: Dict[str, Any],
        metrics: Dict[str, Any],
        dataset_id: Optional[uuid.UUID] = None,
        model_id: Optional[uuid.UUID] = None
    ) -> Experiment:
        """
        Registers a new experiment run with inputs and metrics.
        """
        exp = Experiment(
            name=name,
            hyperparameters=hyperparameters,
            metrics=metrics,
            dataset_id=dataset_id,
            model_id=model_id
        )
        db.add(exp)
        await db.commit()
        await db.refresh(exp)
        return exp

    @staticmethod
    async def get_experiments(db: AsyncSession, limit: int = 50) -> List[Experiment]:
        """
        Retrieves historical runs for auditing and dashboard rendering.
        """
        query = select(Experiment).order_by(Experiment.created_at.desc()).limit(limit)
        res = await db.execute(query)
        return list(res.scalars().all())
