"""
Configuración central de la aplicación
"""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """
    Configuración de la aplicación usando Pydantic Settings
    """
    
    # Información del proyecto
    PROJECT_NAME: str = "COMSIGNS API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Entorno
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
        
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    
    # Supabase Configuration
    SUPABASE_URL: str = Field(default="", env="SUPABASE_URL")
    SUPABASE_ANON_KEY: str = Field(default="", env="SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", env="SUPABASE_SERVICE_ROLE_KEY")
    
    # Seguridad
    SECRET_KEY: str = Field(default="your-secret-key-here", env="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # CORS
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        env="ALLOWED_ORIGINS"
    )
    
    # Machine Learning
    MODEL_PATH: str = Field(default="/app/models/model.h5", env="MODEL_PATH")
    CONFIDENCE_THRESHOLD: float = Field(default=0.65, env="CONFIDENCE_THRESHOLD")

    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(default="JSON", env="LOG_FORMAT")

    
    @property
    def is_development(self) -> bool:
        """
        Verifica si estamos en entorno de desarrollo
        """
        return self.ENVIRONMENT == "development"
    
    @property
    def is_production(self) -> bool:
        """
        Verifica si estamos en entorno de producción
        """
        return self.ENVIRONMENT == "production"

    class Config:
        env_file = ".env"
        case_sensitive = True


# Instancia global de configuración
settings = Settings()
