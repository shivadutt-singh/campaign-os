from celery import Celery
from app.core.config import settings

from celery.schedules import crontab

celery_app = Celery(
    "campaignos_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    imports=("app.tasks",),
    beat_schedule={
        "hourly-drift-detection": {
            "task": "app.tasks.check_drift_task",
            "schedule": crontab(minute=0), # every hour
        },
        "daily-executive-reports": {
            "task": "app.tasks.generate_reports_task",
            "schedule": crontab(minute=0, hour=8), # daily at 8 AM
        },
        "weekly-budget-optimization": {
            "task": "app.tasks.weekly_optimization_task",
            "schedule": crontab(minute=0, hour=9, day_of_week="mon"), # Mon 9 AM
        },
        "nightly-auto-retraining": {
            "task": "app.tasks.auto_retrain_task",
            "schedule": crontab(minute=0, hour=0), # daily midnight
        }
    }
)
