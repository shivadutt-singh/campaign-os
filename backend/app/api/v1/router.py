from fastapi import APIRouter

from app.api.v1 import auth, campaigns, datasets, health, ml, optimize, simulate, websocket

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["Campaign Management"])
api_router.include_router(optimize.router, prefix="/optimize", tags=["Optimization"])
api_router.include_router(simulate.router, prefix="/simulate", tags=["Simulation"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["Dataset Management"])
api_router.include_router(ml.router, prefix="/ml", tags=["ML Pipeline & Model Registry"])
api_router.include_router(health.router, prefix="/health", tags=["Health & Monitoring"])
api_router.include_router(websocket.router, prefix="/realtime", tags=["Real-Time WebSockets"])
