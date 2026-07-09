import sys
from pathlib import Path
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import SimulationRun
from app.schemas.schemas import SimulationRow

# Dynamic inclusion of ai-ml module path
ai_ml_path = Path(__file__).resolve().parent.parent.parent.parent.parent / "ai-ml"
if str(ai_ml_path) not in sys.path:
    sys.path.append(str(ai_ml_path))

try:
    from forecasting.predictor import SimulationEngine
except ImportError as e:
    raise ImportError(f"Could not import SimulationEngine from {ai_ml_path}: {str(e)}")

router = APIRouter()


@router.post("/", response_model=List[SimulationRow])
async def simulate_performance(
    budgets: Dict[str, float],
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Exposes the 10-day predictive simulation engine.
    Stores metadata in SimulationRun and returns daily forecasts.
    """
    try:
        # Run simulation engine
        daily_rows = SimulationEngine.simulate(budgets)
        
        # Calculate simulated total revenue and ROI
        total_budget = sum(float(val) for val in budgets.values() if isinstance(val, (int, float)) or str(val).replace(".", "", 1).isdigit())
        total_expected_revenue = sum(row["Expected_Revenue"] for row in daily_rows)
        roi = ((total_expected_revenue - total_budget) / total_budget * 100) if total_budget > 0 else 0.0
        
        # Log to PostgreSQL SimulationRun table
        sim_run = SimulationRun(
            campaign_id=None,
            budget_payload=budgets,
            simulated_revenue=total_expected_revenue,
            simulated_roi=roi,
            daily_projections=daily_rows
        )
        db.add(sim_run)
        await db.flush()
        
        return daily_rows
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Simulation execution failed: {str(e)}"
        )
