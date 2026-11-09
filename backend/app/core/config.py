"""
Application configuration management using Pydantic Settings.
Loads and validates environment variables from .env or system environment.
"""

from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

    # General Project
    APP_ENV: str = Field(default="development", description="Application environment: development, staging, production")
    PROJECT_NAME: str = Field(default="EduBridge AI Backend", description="Project Name")
    API_V1_PREFIX: str = Field(default="/api/v1", description="API Version 1 prefix")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")

    # Security
    SECRET_KEY: str = Field(
        default="dev_secret_key_change_in_production_min32chars_edubridge",
        description="Core application secret key"
    )
    JWT_SECRET_KEY: str = Field(
        default="dev_jwt_secret_key_change_in_production_min32chars_edubridge",
        description="Secret key for JWT token signing"
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT signing algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, description="Access token validity in minutes")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token validity in days")
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = Field(default=15, description="Password reset token expiration")

    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./edubridge_ai.db",
        description="Async database connection string"
    )
    DATABASE_URL_SYNC: str = Field(
        default="sqlite:///./edubridge_ai.db",
        description="Sync database connection string for migrations"
    )

    # Gemma 4 Cloud AI Tutor Integration
    GEMMA_PROVIDER: str = Field(default="google_ai_studio", description="Cloud provider for Gemma 4 (google_ai_studio, vertex_ai, openai_compatible, mock)")
    GEMMA_API_KEY: str = Field(default="", description="Cloud API key for Gemma 4")
    GEMMA_MODEL: str = Field(default="gemma-4-26b-a4b-it", description="Model identifier")
    GEMMA_API_BASE_URL: str = Field(
        default="https://generativelanguage.googleapis.com/v1beta",
        description="API base endpoint URL"
    )
    GEMMA_TIMEOUT: int = Field(default=30, description="Request timeout in seconds")
    GEMMA_MAX_OUTPUT_TOKENS: int = Field(default=2048, description="Maximum output tokens for response")
    GEMMA_TEMPERATURE: float = Field(default=0.3, description="Sampling temperature for educational accuracy")

    # Sign Language Recognition Settings
    SIGN_CONFIDENCE_THRESHOLD: float = Field(default=0.70, description="Minimum confidence for confirmed signs")
    SIGN_LANGUAGE_DEFAULT: str = Field(default="ISL", description="Default sign language code")
    MAX_TEMPORAL_BUFFER_FRAMES: int = Field(default=30, description="Frames buffer size for temporal gesture models")

    # CORS
    CORS_ORIGINS: Union[List[str], str] = Field(
        default=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
        description="Allowed CORS origins"
    )

    # Paths
    MODELS_DIR: str = Field(default="./ml/model_registry", description="Directory where model weights reside")
    SIGML_DIR: str = Field(default="./ml/assets/sigml", description="Directory for SiGML avatar files")

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @property
    def resolved_models_dir(self) -> Path:
        p = Path(self.MODELS_DIR)
        return p if p.is_absolute() else (BASE_DIR / p).resolve()

    @property
    def resolved_sigml_dir(self) -> Path:
        p = Path(self.SIGML_DIR)
        return p if p.is_absolute() else (BASE_DIR / p).resolve()


settings = Settings()

