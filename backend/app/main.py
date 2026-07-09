import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.services.auth_service import auth_service

# Structured Logging Setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("CampaignOS_Backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed initial superuser and organization
    logger.info("Starting up CampaignOS Backend...")
    try:
        async with AsyncSessionLocal() as db:
            await auth_service.seed_first_superuser(db)
            logger.info("Initial superuser seeding checked/completed.")
    except Exception as e:
        logger.error(f"Error seeding initial superuser: {str(e)}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down CampaignOS Backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise AI Marketing Intelligence Platform API Service",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {
        "message": "Welcome to CampaignOS Enterprise Backend Services",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "openapi_url": "/openapi.json"
    }


# Standard Request Input Validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation failure for request {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=400,
        content={"detail": "Input validation failed. Please check field types.", "errors": exc.errors()}
    )


# General global unhandled error interceptor
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled backend error at {request.url}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please consult logs."}
    )
