#!/usr/bin/env python3
"""
Script d'initialisation des données de test pour AgoraFlux
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from datetime import datetime
from loguru import logger

from app.core.database import SessionLocal
from app.core.security import SecurityUtils
from app.models import User, UserRole, Project, ProjectStatus, ProjectVisibility, Dataset, DatasetType, DatasetStatus, Comment, CommentType, CommentStatus


def create_test_users(db: Session):
    """
    Crée des utilisateurs de test
    """
    logger.info("Création des utilisateurs de test...")
    
    # Administrateur
    admin_user = User(
        email="admin@agoraflux.fr",
        password_hash=SecurityUtils.get_password_hash("admin123"),
        first_name="Admin",
        last_name="AgoraFlux",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
        created_at=datetime.utcnow()
    )
    db.add(admin_user)
    
    # Modérateur
    moderator_user = User(
        email="moderateur@agoraflux.fr",
        password_hash=SecurityUtils.get_password_hash("mod123"),
        first_name="Modérateur",
        last_name="AgoraFlux",
        role=UserRole.MODERATOR,
        is_active=True,
        is_verified=True,
        created_at=datetime.utcnow()
    )
    db.add(moderator_user)
    
    # Utilisateur standard
    user1 = User(
        email="utilisateur@agoraflux.fr",
        password_hash=SecurityUtils.get_password_hash("user123"),
        first_name="Utilisateur",
        last_name="Test",
        role=UserRole.USER,
        is_active=True,
        is_verified=True,
        created_at=datetime.utcnow()
    )
    db.add(user1)
    
    # Utilisateur standard 2
    user2 = User(
        email="marie.dupont@agoraflux.fr",
        password_hash=SecurityUtils.get_password_hash("marie123"),
        first_name="Marie",
        last_name="Dupont",
        role=UserRole.USER,
        is_active=True,
        is_verified=True,
        bio="Citoyenne engagée dans la démocratie participative",
        created_at=datetime.utcnow()
    )
    db.add(user2)
    
    db.commit()
    logger.info("4 utilisateurs créés avec succès")
    
    return {
        "admin": admin_user,
        "moderator": moderator_user,
        "user1": user1,
        "user2": user2
    }


def create_test_projects(db: Session, users: dict):
    """
    Crée des projets de test
    """
    logger.info("Création des projets de test...")
    
    # Projet principal
    project1 = Project(
        title="Analyse du Budget Municipal de Paris 2024",
        slug="budget-municipal-paris-2024",
        description="Analyse collaborative des dépenses publiques de la ville de Paris pour l'année 2024",
        methodology="Analyse des données budgétaires avec visualisations interactives et discussions citoyennes",
        objectives="Comprendre l'allocation des ressources publiques et identifier les priorités municipales",
        expected_outcomes="Rapport collaboratif et recommandations citoyennes",
        status=ProjectStatus.ACTIVE,
        visibility=ProjectVisibility.PUBLIC,
        owner_id=users["admin"].id,
        tags="budget, paris, municipalité, transparence",
        view_count=156,
        likes_count=23,
        created_at=datetime.utcnow()
    )
    db.add(project1)
    
    # Projet utilisateur
    project2 = Project(
        title="Mobilité Urbaine et Transport Public",
        slug="mobilite-urbaine-transport-public",
        description="Étude participative sur l'amélioration des transports en commun",
        methodology="Collecte de données d'usage et enquêtes citoyennes",
        objectives="Identifier les besoins en transport et proposer des améliorations",
        status=ProjectStatus.DRAFT,
        visibility=ProjectVisibility.PUBLIC,
        owner_id=users["user2"].id,
        tags="transport, mobilité, urbain, écologie",
        view_count=42,
        likes_count=7,
        created_at=datetime.utcnow()
    )
    db.add(project2)
    
    db.commit()
    logger.info("2 projets créés avec succès")
    
    return {
        "project1": project1,
        "project2": project2
    }


def create_test_datasets(db: Session, projects: dict, users: dict):
    """
    Crée des datasets de test
    """
    logger.info("Création des datasets de test...")
    
    # Dataset principal
    dataset1 = Dataset(
        name="Budget Municipal Paris 2024 - Dépenses par secteur",
        slug="budget-paris-2024-depenses-secteur",
        description="Données détaillées des dépenses municipales par secteur d'activité",
        type=DatasetType.CSV,
        source_url="https://opendata.paris.fr/explore/dataset/budget-municipal-2024/",
        file_size=2048000,  # 2MB
        rows_count=1250,
        columns_count=12,
        completeness_score=98.5,
        consistency_score=96.2,
        validity_score=99.8,
        overall_quality_score=98.1,
        status=DatasetStatus.PROCESSED,
        project_id=projects["project1"].id,
        uploaded_by_id=users["admin"].id,
        column_metadata={
            "columns": ["secteur", "sous_secteur", "montant", "evolution", "pourcentage"],
            "source_format": "CSV",
            "encoding": "UTF-8",
            "separator": ";"
        },
        created_at=datetime.utcnow(),
        processed_at=datetime.utcnow()
    )
    db.add(dataset1)
    
    db.commit()
    logger.info("1 dataset créé avec succès")
    
    return {
        "dataset1": dataset1
    }


def create_test_comments(db: Session, projects: dict, users: dict):
    """
    Crée des commentaires de test
    """
    logger.info("Création des commentaires de test...")
    
    # Commentaire principal
    comment1 = Comment(
        content="Excellente initiative ! Ces données sur le budget municipal sont très utiles pour comprendre les priorités de la ville. J'aimerais voir une analyse plus détaillée des dépenses en éducation.",
        type=CommentType.COMMENT,
        status=CommentStatus.ACTIVE,
        author_id=users["user1"].id,
        project_id=projects["project1"].id,
        likes_count=5,
        created_at=datetime.utcnow()
    )
    db.add(comment1)
    
    # Réponse au commentaire
    comment2 = Comment(
        content="Merci pour votre retour ! Nous travaillons justement sur un focus spécial éducation. Les données détaillées seront disponibles la semaine prochaine.",
        type=CommentType.COMMENT,
        status=CommentStatus.ACTIVE,
        author_id=users["admin"].id,
        project_id=projects["project1"].id,
        parent_id=comment1.id,
        thread_depth=1,
        likes_count=2,
        created_at=datetime.utcnow()
    )
    db.add(comment2)
    
    # Suggestion
    comment3 = Comment(
        content="Suggestion : il serait intéressant d'ajouter une comparaison avec les budgets des années précédentes pour voir l'évolution des priorités.",
        type=CommentType.SUGGESTION,
        status=CommentStatus.ACTIVE,
        author_id=users["user2"].id,
        project_id=projects["project1"].id,
        likes_count=8,
        is_highlighted=True,
        created_at=datetime.utcnow()
    )
    db.add(comment3)
    
    # Question
    comment4 = Comment(
        content="Question : les données incluent-elles les investissements ou seulement les dépenses de fonctionnement ?",
        type=CommentType.QUESTION,
        status=CommentStatus.ACTIVE,
        author_id=users["moderator"].id,
        project_id=projects["project1"].id,
        likes_count=3,
        is_pinned=True,
        created_at=datetime.utcnow()
    )
    db.add(comment4)
    
    db.commit()
    
    # Mettre à jour les compteurs
    comment1.replies_count = 1
    projects["project1"].comments_count = 4
    db.commit()
    
    logger.info("4 commentaires créés avec succès")


def init_test_data():
    """
    Initialise toutes les données de test
    """
    logger.info("Initialisation des données de test pour AgoraFlux...")
    
    db = SessionLocal()
    
    try:
        # Vérifier si des données existent déjà
        existing_users = db.query(User).count()
        if existing_users > 0:
            logger.warning(f"{existing_users} utilisateurs existent déjà. Suppression des données existantes...")
            # Supprimer dans l'ordre inverse des dépendances
            db.query(Comment).delete()
            db.query(Dataset).delete()
            db.query(Project).delete()
            db.query(User).delete()
            db.commit()
        
        # Créer les données de test
        users = create_test_users(db)
        projects = create_test_projects(db, users)
        datasets = create_test_datasets(db, projects, users)
        create_test_comments(db, projects, users)
        
        logger.success("Données de test initialisées avec succès !")
        
        # Afficher les informations de connexion
        print("\n" + "="*60)
        print("COMPTES DE TEST CRÉÉS")
        print("="*60)
        print("Admin:")
        print("  Email: admin@agoraflux.fr")
        print("  Mot de passe: admin123")
        print("  Rôle: Administrateur")
        print()
        print("Modérateur:")
        print("  Email: moderateur@agoraflux.fr")
        print("  Mot de passe: mod123")
        print("  Rôle: Modérateur")
        print()
        print("Utilisateur 1:")
        print("  Email: utilisateur@agoraflux.fr")
        print("  Mot de passe: user123")
        print("  Rôle: Utilisateur")
        print()
        print("Utilisateur 2:")
        print("  Email: marie.dupont@agoraflux.fr")
        print("  Mot de passe: marie123")
        print("  Rôle: Utilisateur")
        print("="*60)
        
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation des données de test: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_test_data() 