from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import alert, etf, health, image, macro, performance, portfolio, prediction, recommendation, sentiment, stock, user
from app.scheduler.jobs import start_scheduler, stop_scheduler
from app.services import telegram_service
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

    # Telegram bot
    bot_app = telegram_service.build_bot_application()
    if bot_app and settings.telegram_bot_enabled:
        await telegram_service.start_bot()
    else:
        logger.info("Telegram bot disabled (token=%s, enabled=%s)",
                     bool(settings.telegram_bot_token), settings.telegram_bot_enabled)

    yield

    # Shutdown
    await telegram_service.stop_bot()
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
app.include_router(portfolio.router)
app.include_router(prediction.router)
app.include_router(recommendation.router)
app.include_router(alert.router)
app.include_router(etf.router)
app.include_router(performance.router)
app.include_router(image.router)
app.include_router(user.router)
