from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health, macro, prediction, sentiment, stock
from app.scheduler.jobs import start_scheduler, stop_scheduler
from app.utils.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Stock Intelligence Platform API")
    if settings.scheduler_enabled:
        start_scheduler()
    else:
        logger.info("Scheduler disabled by SCHEDULER_ENABLED=false")
    yield
    # Shutdown
    stop_scheduler()
    logger.info("API shutdown complete")


app = FastAPI(
    title="Stock Intelligence Platform API",
    description="AI 기반 주식 분석 + 거시경제 리스크 분석 백엔드",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(macro.router)
app.include_router(stock.router)
app.include_router(sentiment.router)
app.include_router(prediction.router)
