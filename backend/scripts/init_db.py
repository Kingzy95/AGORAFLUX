#!/usr/bin/env python
"""
Script d'initialisation de la base de données AgoraFlux
Crée les tables et ajoute des données de test
"""

import sys
import os
from datetime import datetime, timedelta

# Ajouter le répertoire parent au PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, SessionLocal, create_tables
from app.models import (
    User, Project, Dataset, Comment, 
    UserRole, ProjectStatus, DatasetType, DatasetStatus, CommentType
)
from app.core.logging import get_logger
from passlib.context import CryptContext

logger = get_logger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_admin_user(db: SessionLocal) -> User:
    """Crée un utilisateur administrateur par défaut"""
    admin_user = User(
        email="admin@agoraflux.fr",
        username="admin",
        full_name="Administrateur AgoraFlux",
        hashed_password=pwd_context.hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
        bio="Compte administrateur de la plateforme AgoraFlux"
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    logger.info(f"✅ Utilisateur admin créé: {admin_user.email}")
    return admin_user


def create_test_users(db: SessionLocal) -> list[User]:
    """Crée des utilisateurs de test"""
    test_users = [
        User(
            email="moderateur@agoraflux.fr",
            username="moderateur",
            full_name="Modérateur Test",
            hashed_password=pwd_context.hash("mod123"),
            role=UserRole.MODERATOR,
            is_active=True,
            is_verified=True,
            bio="Compte modérateur de test"
        ),
        User(
            email="citoyen@agoraflux.fr",
            username="citoyen1",
            full_name="Citoyen Engagé",
            hashed_password=pwd_context.hash("user123"),
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
            bio="Citoyen engagé dans la démocratie participative",
            location="Paris, France"
        ),
        User(
            email="marie.dupont@agoraflux.fr",
            username="marie_dupont",
            full_name="Marie Dupont",
            hashed_password=pwd_context.hash("user123"),
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
            bio="Analyste de données publiques",
            location="Lyon, France"
        )
    ]
    
    for user in test_users:
        db.add(user)
    
    db.commit()
    
    for user in test_users:
        db.refresh(user)
        logger.info(f"✅ Utilisateur test créé: {user.email}")
    
    return test_users


def create_sample_project(db: SessionLocal, owner: User) -> Project:
    """Crée un projet de démonstration"""
    project = Project(
        title="Analyse du Budget Municipal de Paris 2024",
        slug="budget-municipal-paris-2024",
        description="""
        Projet de collaboration citoyenne pour analyser et visualiser 
        le budget municipal de Paris 2024. Ce projet vise à rendre 
        les données budgétaires plus accessibles et compréhensibles 
        pour les citoyens.
        
        **Objectifs:**
        - Analyser les postes de dépenses principaux
        - Identifier les évolutions par rapport à 2023
        - Créer des visualisations interactives
        - Faciliter le débat citoyen autour des priorités budgétaires
        """,
        status=ProjectStatus.ACTIVE,
        owner_id=owner.id,
        tags="budget, municipal, paris, 2024, finances publiques",
        objectives="Démocratiser l'accès aux données budgétaires municipales",
        methodology="Analyse statistique et visualisation de données ouvertes",
        allow_comments=True,
        allow_contributions=True,
        moderation_enabled=False,
        published_at=datetime.utcnow(),
        view_count=42,
        contributor_count=3
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    logger.info(f"✅ Projet créé: {project.title}")
    return project


def create_sample_dataset(db: SessionLocal, project: Project, user: User) -> Dataset:
    """Crée un dataset de démonstration"""
    dataset = Dataset(
        name="Budget Municipal Paris 2024 - Dépenses par secteur",
        description="Données ouvertes des dépenses municipales de Paris par secteur d'activité",
        source_url="https://opendata.paris.fr/explore/dataset/budget-vote/",
        dataset_type=DatasetType.CSV,
        status=DatasetStatus.PROCESSED,
        original_filename="budget_paris_2024.csv",
        file_size=1024000,  # 1MB
        project_id=project.id,
        uploaded_by_id=user.id,
        row_count=156,
        column_count=8,
        missing_values_count=3,
        duplicate_rows_count=0,
        completeness_score=98.1,
        consistency_score=95.5,
        validity_score=99.2,
        export_formats="csv,json,xlsx",
        is_exportable=True
    )
    
    # Mise à jour automatique de la qualité
    dataset.update_quality_assessment(98.1, 95.5, 99.2)
    
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    logger.info(f"✅ Dataset créé: {dataset.name}")
    return dataset


def create_sample_comments(db: SessionLocal, project: Project, users: list[User]):
    """Création de commentaires de démonstration désactivée"""
    logger.info("Création de commentaires de démonstration désactivée")
    return


def init_database():
    """Fonction principale d'initialisation"""
    logger.info("🚀 Initialisation de la base de données AgoraFlux...")
    
    # Créer les tables
    create_tables()
    
    # Créer une session
    db = SessionLocal()
    
    try:
        # Vérifier si des données existent déjà
        if db.query(User).first():
            logger.warning("⚠️ Des données existent déjà. Arrêt de l'initialisation.")
            return
        
        # Créer les utilisateurs
        admin = create_admin_user(db)
        test_users = create_test_users(db)
        all_users = [admin] + test_users
        
        # Créer un projet de démonstration
        project = create_sample_project(db, admin)
        
        # Créer un dataset de démonstration
        dataset = create_sample_dataset(db, project, test_users[1])
        
        # Créer des commentaires de démonstration (désactivé)
        logger.info("Commentaires de démonstration désactivés")
        
        logger.info("✅ Base de données initialisée avec succès!")
        logger.info("📊 Données créées:")
        logger.info(f"   - {len(all_users)} utilisateurs")
        logger.info(f"   - 1 projet")
        logger.info(f"   - 1 dataset")
        logger.info(f"   - 4 commentaires")
        
        logger.info("🔑 Comptes de connexion:")
        logger.info("   Admin: admin@agoraflux.fr / admin123")
        logger.info("   Modérateur: moderateur@agoraflux.fr / mod123")
        logger.info("   Utilisateur: citoyen@agoraflux.fr / user123")
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'initialisation: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database() 