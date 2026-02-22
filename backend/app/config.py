from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Scheduler
    scheduler_enabled: bool = True

    # OpenRouter (Day 3+)
    openrouter_api_key: str = ""

    # Telegram (Day 5+)
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
