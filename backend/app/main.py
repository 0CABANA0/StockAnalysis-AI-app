from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    admin,
    ask,
    calendar,
    etf,
    fear_greed,
    geo,
    glossary,
    guide,
    health,
    image,
    macro,
    recommendation,
    sentiment,
    simulator,
    stock,
    user,
    watchlist,
)
from app.scheduler.jobs import start_scheduler, stop_scheduler
from app.services import telegram_service
from app.utils.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Stock Intelligence Guide Platform API")
    if settings.scheduler_enabled:
        start_scheduler()
    else:
        logger.info("Scheduler disabled by SCHEDULER_ENABLED=false")

    # Telegram bot
    bot_app = telegram_service.build_bot_application()
    if bot_app and settings.telegram_bot_enabled:
        await telegram_service.start_bot()
    else:
        logger.info(
            "Telegram bot disabled (token=%s, enabled=%s)",
            bool(settings.telegram_bot_token),
            settings.telegram_bot_enabled,
        )

    yield

    # Shutdown
    await telegram_service.stop_bot()
    stop_scheduler()
    logger.info("API shutdown complete")


app = FastAPI(
    title="Stock Intelligence Guide Platform API",
    description="거시경제 + 지정학 기반 AI 투자 가이드 백엔드",
    version="2.0.0",
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

# Core routers
app.include_router(health.router)
app.include_router(macro.router)
app.include_router(geo.router)
app.include_router(guide.router)
app.include_router(stock.router)
app.include_router(sentiment.router)
app.include_router(recommendation.router)
app.include_router(etf.router)
app.include_router(image.router)
app.include_router(watchlist.router)
app.include_router(calendar.router)
app.include_router(simulator.router)
app.include_router(fear_greed.router)
app.include_router(ask.router)
app.include_router(glossary.router)
app.include_router(user.router)
app.include_router(admin.router)
