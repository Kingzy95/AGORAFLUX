"""
Configuration du système de logging pour AgoraFlux
Utilise Loguru pour un logging moderne et flexible
"""

import sys
from pathlib import Path
from loguru import logger
from app.core.config import settings


def setup_logging():
    """
    Configure le système de logging avec Loguru
    """
    # Supprimer la configuration par défaut
    logger.remove()
    
    # Configuration pour la console (développement)
    if settings.DEBUG:
        logger.add(
            sys.stdout,
            level="DEBUG",
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
                   "<level>{level: <8}</level> | "
                   "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
                   "<level>{message}</level>",
            colorize=True,
        )
    else:
        logger.add(
            sys.stdout,
            level="INFO",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        )
    
    # Configuration pour les fichiers de log
    log_path = Path(settings.LOG_FILE)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Log général
    logger.add(
        log_path,
        level=settings.LOG_LEVEL,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        rotation="10 MB",
        retention="30 days",
        compression="zip",
    )
    
    # Log des erreurs séparé
    error_log_path = log_path.parent / "errors.log"
    logger.add(
        error_log_path,
        level="ERROR",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        rotation="10 MB",
        retention="90 days",
        compression="zip",
    )
    
    logger.info("Système de logging configuré")


def get_logger(name: str):
    """
    Retourne un logger configuré pour un module spécifique
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