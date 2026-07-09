import sys
from pathlib import Path
from typing import Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import OptimizationRun
from app.schemas.schemas import OptimizeRequest, OptimizeResponse

# Dynamic inclusion of ai-ml module path
ai_ml_path = Path(__file__).resolve().parent.parent.parent.parent.parent / "ai-ml"
if str(ai_ml_path) not in sys.path:
    sys.path.append(str(ai_ml_path))

try:
    from optimization.solver import OptimizationEngine
except ImportError as e:
    raise ImportError(f"Could not import OptimizationEngine from {ai_ml_path}: {str(e)}")

router = APIRouter()


@router.post("/", response_model=OptimizeResponse)
async def optimize_budgets(
    request: OptimizeRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Exposes the budget optimization solver to the frontend.
    Computes allocations and logs the optimization run in the database.
    """
    try:
        # Run optimization engine
        result = OptimizationEngine.optimize(request.targetRevenue)
        
        # Log to PostgreSQL OptimizationRun table
        opt_run = OptimizationRun(
            campaign_id=None,  # Not associated with a specific campaign on simple slider page
            target_revenue=request.targetRevenue,
            recommended_budget=result["total_recommended_budget"],
            allocations=result["allocations"],
            saturation_warning=result["saturation_warning"],
            warning_message=result.get("warning_message")
        )
        db.add(opt_run)
        await db.flush()
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Budget optimization failed: {str(e)}"
        )
