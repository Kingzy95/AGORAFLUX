"""
Configuration de la base de données pour AgoraFlux
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Création de l'engine SQLAlchemy
engine = create_engine(
    settings.database_url_sync,
    echo=settings.DATABASE_ECHO,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600
)

# Création de la session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Générateur de session de base de données pour les dépendances FastAPI
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Erreur de base de données: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_tables():
    """
    Crée toutes les tables de la base de données
    """
    logger.info("Création des tables de base de données...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tables créées avec succès")


def drop_tables():
    """
    Supprime toutes les tables de la base de données
    ATTENTION: Utilisez uniquement en développement !
    """
    if settings.ENVIRONMENT == "production":
        raise RuntimeError("Impossible de supprimer les tables en production!")
    
    logger.warning("Suppression de toutes les tables...")
    Base.metadata.drop_all(bind=engine)
    logger.warning("Tables supprimées")


def init_db():
    """
    Initialise la base de données avec les tables de base
    """
    logger.info("Initialisation de la base de données...")
    create_tables()
    
    # TODO: Ajouter ici les données de base (admin, rôles, etc.)
    logger.info("Base de données initialisée")


# Test de connexion au démarrage
def test_connection():
    """
    Teste la connexion à la base de données
    """
    try:
        with engine.connect() as connection:
            logger.info("✅ Connexion à la base de données réussie")
            return True
    except Exception as e:
        logger.error(f"❌ Erreur de connexion à la base de données: {e}")
        return False 