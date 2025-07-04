"""
Configuration centralisée de l'application AgoraFlux
Gestion des variables d'environnement avec Pydantic Settings
"""

from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    """
    Configuration de l'application AgoraFlux
    """
    
    # Configuration générale
    PROJECT_NAME: str = "AgoraFlux"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Plateforme de simulation et collaboration citoyenne"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Configuration serveur
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "0.0.0.0"]
    
    # Configuration CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    # Configuration base de données
    DATABASE_URL: str = "postgresql://postgres:admin@localhost:5432/agoraflux"
    DATABASE_ECHO: bool = True  # Active les logs SQL en développement
    
    # Configuration authentification
    SECRET_KEY: str = "votre-cle-secrete-super-forte-changez-moi"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Configuration sécurité
    PASSWORD_MIN_LENGTH: int = 8
    BCRYPT_ROUNDS: int = 12
    MAX_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCK_DURATION: int = 900  # 15 minutes en secondes
    
    # Configuration données
    DATA_UPLOAD_PATH: str = "data/uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: List[str] = [".csv", ".json", ".xlsx"]
    
    # Configuration logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/agoraflux.log"
    
    # Configuration visualisations
    CHART_EXPORT_PATH: str = "exports/charts"
    MAX_CHART_WIDTH: int = 1920
    MAX_CHART_HEIGHT: int = 1080
    
    @validator("ENVIRONMENT")
    def validate_environment(cls, v):
        """Valide l'environnement"""
        allowed = ["development", "testing", "staging", "production"]
        if v not in allowed:
            raise ValueError(f"ENVIRONMENT doit être un de: {allowed}")
        return v
    
    @validator("DATABASE_URL")
    def validate_database_url(cls, v):
        """Valide l'URL de la base de données"""
        if not v.startswith(("postgresql://", "sqlite:///")):
            raise ValueError("DATABASE_URL doit commencer par postgresql:// ou sqlite:///")
        return v
    
    @property
    def is_development(self) -> bool:
        """Vérifie si on est en environnement de développement"""
        return self.ENVIRONMENT == "development"
    
    @property
    def is_production(self) -> bool:
        """Vérifie si on est en environnement de production"""
        return self.ENVIRONMENT == "production"
    
    @property
    def database_url_sync(self) -> str:
        """URL de base de données synchrone pour SQLAlchemy"""
        if self.DATABASE_URL.startswith("postgresql://"):
            return self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://")
        return self.DATABASE_URL
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore les variables d'environnement supplémentaires


# Instance globale des paramètres
settings = Settings() 