"""
Configuration du système de logging pour AgoraFlux
Utilise Loguru pour un logging structuré et performant
"""

import sys
from pathlib import Path
from loguru import logger
from app.core.config import settings


def setup_logging():
    """
    Configure le système de logging de l'application
    """
    # Supprimer la configuration par défaut de loguru
    logger.remove()
    
    # Configuration pour la console (développement)
    if settings.is_development:
        logger.add(
            sys.stdout,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
                   "<level>{level: <8}</level> | "
                   "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
                   "<level>{message}</level>",
            level=settings.LOG_LEVEL,
            colorize=True
        )
    
    # Configuration pour fichier de logs
    log_file_path = Path(settings.LOG_FILE)
    log_file_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Logs généraux avec rotation
    logger.add(
        settings.LOG_FILE,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        level=settings.LOG_LEVEL,
        rotation="10 MB",
        retention="30 days",
        compression="gz",
        serialize=False
    )
    
    # Logs d'erreurs séparés
    error_log_path = log_file_path.parent / "errors.log"
    logger.add(
        str(error_log_path),
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        level="ERROR",
        rotation="5 MB",
        retention="60 days",
        compression="gz",
        serialize=False
    )
    
    # Logs d'accès pour l'API (production)
    if settings.is_production:
        access_log_path = log_file_path.parent / "access.log"
        logger.add(
            str(access_log_path),
            format="{time:YYYY-MM-DD HH:mm:ss} | {message}",
            filter=lambda record: record["extra"].get("access_log", False),
            rotation="100 MB",
            retention="90 days",
            compression="gz"
        )


def get_logger(name: str):
    """
    Obtient un logger configuré pour un module spécifique
    
    Args:
        name: Nom du module (généralement __name__)
    
    Returns:
        Logger configuré
    """
    return logger.bind(name=name)


# Fonction utilitaire pour logger les requêtes API
def log_api_access(method: str, path: str, status_code: int, response_time: float, user_id: str = None):
    """
    Log les accès à l'API
    
    Args:
        method: Méthode HTTP
        path: Chemin de la requête
        status_code: Code de statut de la réponse
        response_time: Temps de réponse en millisecondes
        user_id: ID de l'utilisateur (optionnel)
    """
    user_info = f"user:{user_id}" if user_id else "anonymous"
    
    logger.bind(access_log=True).info(
        f"{method} {path} {status_code} {response_time:.2f}ms {user_info}"
    ) 