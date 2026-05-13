from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "microclimate"
    postgres_user: str = "postgres"
    postgres_password: str = "changeme"
    database_url: Optional[str] = None

    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    gee_service_account: Optional[str] = None
    gee_key_file: Optional[str] = None
    gee_project: Optional[str] = None

    pinn_model_path: str = "ai_model/checkpoints/latest.pt"
    openfoam_case_dir: str = "simulation/base_case"

    app_env: str = "development"
    secret_key: str = "dev-secret-key"

    @property
    def db_url(self) -> str:
        if self.database_url:
            return self.database_url
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
