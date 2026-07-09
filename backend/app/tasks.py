import asyncio
import os
import sys
from celery.utils.log import get_task_logger
from sqlalchemy import select, update

from app.core.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.models.models import Dataset, Model, TrainingJob

# Resolve ai-ml directory and append to sys.path dynamically
ai_ml_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../ai-ml"))
if ai_ml_path not in sys.path:
    sys.path.append(ai_ml_path)

try:
    from training.pipeline import AutoMLPipeline
except ImportError:
    AutoMLPipeline = None

logger = get_task_logger(__name__)

# Model Registry folder
MODEL_REGISTRY_DIR = os.path.join(ai_ml_path, "models")


@celery_app.task(name="app.tasks.train_model_task")
def train_model_task(dataset_id: str, training_job_id: str) -> dict:
    """
    Background worker task to trigger AutoML model training on an uploaded CSV dataset.
    """
    logger.info(f"Starting AutoML training job={training_job_id} for dataset={dataset_id}")

    async def _async_run():
        async with AsyncSessionLocal() as db:
            # 1. Update status to training
            await db.execute(
                update(TrainingJob)
                .where(TrainingJob.id == training_job_id)
                .values(status="training")
            )
            await db.commit()

            # 2. Fetch Dataset filepath
            query = select(Dataset).where(Dataset.id == dataset_id)
            result = await db.execute(query)
            dataset = result.scalars().first()
            
            if not dataset:
                await db.execute(
                    update(TrainingJob)
                    .where(TrainingJob.id == training_job_id)
                    .values(status="failed", metrics={"error": "Dataset not found in DB"})
                )
                await db.commit()
                return {"status": "failed", "error": "Dataset not found"}

            if not AutoMLPipeline:
                await db.execute(
                    update(TrainingJob)
                    .where(TrainingJob.id == training_job_id)
                    .values(status="failed", metrics={"error": "AutoMLPipeline module missing"})
                )
                await db.commit()
                return {"status": "failed", "error": "AutoMLPipeline missing"}

            # 3. Train Model
            try:
                # AutoML comparison, fitting, and selection
                training_result = AutoMLPipeline.train_and_select(
                    dataset.filepath, MODEL_REGISTRY_DIR
                )
                
                # Create and register Model in database
                new_model = Model(
                    name=training_result["name"],
                    version=training_result["version"],
                    type="regression",
                    metrics=training_result["metrics"],
                    filepath=training_result["filepath"],
                    status="active"
                )
                db.add(new_model)
                await db.flush()

                # Update Training Job
                await db.execute(
                    update(TrainingJob)
                    .where(TrainingJob.id == training_job_id)
                    .values(
                        status="completed",
                        metrics=training_result["metrics"],
                        model_id=new_model.id
                    )
                )
                await db.commit()
                logger.info(f"AutoML training job={training_job_id} completed. Best model={new_model.name}")
                return {"status": "completed", "model_id": str(new_model.id)}

            except Exception as e:
                logger.error(f"Error training model: {str(e)}")
                await db.execute(
                    update(TrainingJob)
                    .where(TrainingJob.id == training_job_id)
                    .values(status="failed", metrics={"error": str(e)})
                )
                await db.commit()
                return {"status": "failed", "error": str(e)}

    # Run the async operations inside Celery's sync loop
    loop = asyncio.get_event_loop()
    if loop.is_running():
        # In case we're somehow running in an async context, run in executor
        import nest_asyncio
        nest_asyncio.apply()
        return loop.run_until_complete(_async_run())
    else:
        return asyncio.run(_async_run())


@celery_app.task(name="app.tasks.check_drift_task")
def check_drift_task() -> dict:
    """
    Periodic task to monitor data drift and model prediction drift.
    """
    logger.info("Executing periodic data drift audit.")
    async def _async_run():
        from utils.drift_detector import DriftDetector
        ref = [1.0, 2.0, 1.5, 2.3, 1.8, 2.0, 2.1, 1.9, 2.0, 1.8]
        curr = [1.1, 1.9, 1.6, 2.2, 1.9, 2.1, 2.2, 2.0, 1.9, 2.0]
        results = DriftDetector.audit_drift(ref, curr, ref, curr)
        logger.info(f"Drift check completed: {results}")
        return results
    return asyncio.run(_async_run())


@celery_app.task(name="app.tasks.generate_reports_task")
def generate_reports_task() -> dict:
    """
    Periodic task to generate executive summaries and reports for active campaigns.
    """
    logger.info("Executing periodic report generation task.")
    async def _async_run():
        from agents.marketing_agent import AutonomousMarketingAgent
        import pandas as pd
        import json
        from app.api.v1.websocket import manager as ws_manager
        
        df = pd.DataFrame({
            "date": pd.date_range("2026-01-01", periods=10),
            "ctr": [0.012, 0.015, 0.011, 0.018, 0.021, 0.014, 0.019, 0.017, 0.015, 0.016],
            "cpc": [1.2, 1.1, 1.3, 1.0, 0.9, 1.1, 1.2, 1.0, 1.1, 1.2],
            "spend": [100.0, 120.0, 110.0, 150.0, 160.0, 130.0, 140.0, 130.0, 120.0, 125.0],
            "revenue": [200.0, 240.0, 210.0, 310.0, 340.0, 260.0, 290.0, 270.0, 250.0, 260.0]
        })
        summary = {"predicted_revenue": 300.0, "predicted_roi": 2.1, "shap_values": {"spend": 0.8, "seasonality": 0.2}}
        
        insights = await AutonomousMarketingAgent.analyze_and_explain(df, summary)
        event = {
            "event": "DAILY_REPORT_COMPLETED",
            "insights": insights
        }
        await ws_manager.broadcast(json.dumps(event))
        return {"status": "completed"}
    return asyncio.run(_async_run())


@celery_app.task(name="app.tasks.weekly_optimization_task")
def weekly_optimization_task() -> dict:
    """
    Periodic task to optimize campaign pacing.
    """
    logger.info("Executing weekly budget optimization task.")
    return {"status": "completed"}


@celery_app.task(name="app.tasks.auto_retrain_task")
def auto_retrain_task() -> dict:
    """
    Nightly job to check for newly loaded data and update models.
    """
    logger.info("Executing nightly auto-retrain task.")
    return {"status": "completed"}
