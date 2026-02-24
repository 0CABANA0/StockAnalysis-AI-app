from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Scheduler
    scheduler_enabled: bool = True

    # OpenRouter
    openrouter_api_key: str = ""

    # Telegram
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""
    telegram_bot_enabled: bool = False

    # KOFIA
    kofia_api_key: str = ""

    # v2.0 신규
    fred_api_key: str = ""
    ecos_api_key: str = ""
    app_domain: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
