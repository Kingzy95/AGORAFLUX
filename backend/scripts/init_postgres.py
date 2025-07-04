#!/usr/bin/env python3
"""
Script d'initialisation de la base de données PostgreSQL pour AgoraFlux
"""

import sys
import os
from pathlib import Path

# Ajouter le répertoire parent au PYTHONPATH
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from app.core.config import settings
from app.core.database import Base
from app.models import User, Project, Dataset, Comment
from app.schemas.user import UserCreate
from app.schemas.project import ProjectCreate
from app.schemas.dataset import DatasetCreate
from app.schemas.comment import CommentCreate
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from datetime import datetime, timedelta
import json

# Configuration du hachage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def init_database():
    """Initialise la base de données PostgreSQL"""
    print("🔧 Initialisation de la base de données PostgreSQL...")
    
    # Créer le moteur de base de données
    engine = create_engine(settings.DATABASE_URL, echo=True)
    
    # Créer toutes les tables
    print("📋 Création des tables...")
    Base.metadata.create_all(bind=engine)
    
    # Créer une session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Vérifier si des données existent déjà
        if db.query(User).first():
            print("⚠️  Des données existent déjà dans la base.")
            return
        
        print("👥 Création des utilisateurs de test...")
        
        # Créer les utilisateurs
        users_data = [
            {
                "email": "admin@agoraflux.fr",
                "username": "admin",
                "full_name": "Admin AgoraFlux",
                "hashed_password": hash_password("admin123"),
                "role": "admin",
                "is_active": True,
                "bio": "Administrateur de la plateforme AgoraFlux"
            },
            {
                "email": "moderateur@agoraflux.fr", 
                "username": "moderateur",
                "full_name": "Jean Modérateur",
                "hashed_password": hash_password("mod123"),
                "role": "moderator",
                "is_active": True,
                "bio": "Modérateur expérimenté en données publiques"
            },
            {
                "email": "utilisateur@agoraflux.fr",
                "username": "utilisateur",
                "full_name": "Pierre Utilisateur",
                "hashed_password": hash_password("user123"),
                "role": "user",
                "is_active": True,
                "bio": "Utilisateur engagé dans la transparence des données publiques"
            },
            {
                "email": "marie.dupont@agoraflux.fr",
                "username": "marie.dupont",
                "full_name": "Marie Dupont",
                "hashed_password": hash_password("user123"),
                "role": "user",
                "is_active": True,
                "bio": "Analyste de données et utilisatrice active"
            }
        ]
        
        users = []
        for user_data in users_data:
            user = User(**user_data)
            db.add(user)
            users.append(user)
        
        db.commit()
        
        print("📊 Création du projet de test...")
        
        # Créer un projet
        project = Project(
            title="Analyse du Budget Municipal de Paris 2024",
            slug="analyse-budget-municipal-paris-2024",
            description="Analyse collaborative du budget municipal de Paris pour l'année 2024, avec focus sur les dépenses par secteur et l'évolution des investissements.",
            owner_id=users[0].id,  # admin
            status="active",
            visibility="public",
            tags="budget, paris, municipal, 2024, finances-publiques",
            methodology="Analyse des données budgétaires officielles avec visualisations interactives et espaces de discussion citoyenne.",
            objectives="Transparence budgétaire, Participation citoyenne, Analyse des priorités"
        )
        
        db.add(project)
        db.commit()
        
        print("📈 Création du dataset de test...")
        
        # Créer un dataset
        dataset = Dataset(
            name="Budget Municipal Paris 2024 - Dépenses par secteur",
            description="Données détaillées des dépenses budgétaires de la ville de Paris par secteur d'activité",
            source_url="https://opendata.paris.fr/explore/dataset/budget-municipal-2024",
            dataset_type="csv",
            file_size=2621440,  # 2.5MB en bytes
            status="processed",
            quality="excellent",
            row_count=1250,
            column_count=4,
            missing_values_count=23,
            duplicate_rows_count=5,
            completeness_score=98.5,
            consistency_score=97.8,
            validity_score=98.0,
            column_metadata={
                "secteur": {"type": "string", "description": "Secteur d'activité"},
                "montant": {"type": "float", "description": "Montant en euros"},
                "pourcentage": {"type": "float", "description": "Pourcentage du budget total"},
                "evolution": {"type": "float", "description": "Évolution par rapport à 2023"}
            },
            processing_config={
                "source": "Ville de Paris - Direction des Finances",
                "licence": "Open Data Commons",
                "derniere_maj": "2024-01-15",
                "periodicite": "Annuelle"
            },
            processing_log="2024-01-16 10:00: Import des données CSV\n2024-01-16 10:05: Validation des colonnes numériques\n2024-01-16 10:07: Calcul des scores de qualité\n2024-01-16 10:10: Génération des métadonnées",
            project_id=project.id,
            uploaded_by_id=users[1].id  # moderateur
        )
        
        db.add(dataset)
        db.commit()
        
        print("💬 Création des commentaires de test...")
        
        # Créer des commentaires
        comments_data = [
            {
                "content": "Excellente initiative ! Les données sur l'éducation sont particulièrement intéressantes. Avez-vous prévu d'analyser l'évolution sur 5 ans ?",
                "comment_type": "comment",
                "author_id": users[2].id,  # utilisateur
                "project_id": project.id,
                "like_count": 3,
                "flag_count": 0,
                "status": "approved"
            },
            {
                "content": "Je suggère d'ajouter une comparaison avec d'autres métropoles françaises pour contextualiser les montants.",
                "comment_type": "suggestion", 
                "author_id": users[3].id,  # marie.dupont
                "project_id": project.id,
                "like_count": 5,
                "flag_count": 0,
                "status": "approved"
            }
        ]
        
        comments = []
        for comment_data in comments_data:
            comment = Comment(**comment_data)
            db.add(comment)
            comments.append(comment)
        
        db.commit()
        
        # Créer des réponses aux commentaires
        responses_data = [
            {
                "content": "Bonne idée ! Je vais regarder les données historiques disponibles sur le portail Open Data.",
                "comment_type": "comment",
                "author_id": users[1].id,  # moderateur
                "project_id": project.id,
                "parent_id": comments[0].id,
                "like_count": 1,
                "flag_count": 0,
                "status": "approved"
            },
            {
                "content": "Excellente suggestion Marie ! Lyon et Marseille ont des budgets similaires, ça pourrait être très pertinent.",
                "comment_type": "comment",
                "author_id": users[0].id,  # admin
                "project_id": project.id,
                "parent_id": comments[1].id,
                "like_count": 2,
                "flag_count": 0,
                "status": "approved"
            }
        ]
        
        for response_data in responses_data:
            response = Comment(**response_data)
            db.add(response)
        
        db.commit()
        
        print("✅ Base de données PostgreSQL initialisée avec succès !")
        print("\n📊 Résumé des données créées :")
        print(f"   👥 {len(users)} utilisateurs")
        print(f"   📁 1 projet")
        print(f"   📈 1 dataset")
        print(f"   💬 {len(comments_data) + len(responses_data)} commentaires")
        
        print("\n🔐 Comptes de test créés :")
        print("   👨‍💼 Admin: admin@agoraflux.fr / admin123")
        print("   👨‍🔧 Modérateur: moderateur@agoraflux.fr / mod123")
        print("   👨‍💻 Utilisateur: utilisateur@agoraflux.fr / user123")
        print("   👩‍💻 Marie: marie.dupont@agoraflux.fr / user123")
        
        print("\n🌐 Accès :")
        print("   🗄️  pgAdmin: http://localhost:8081 (admin@agoraflux.fr / admin)")
        print("   🚀 API: http://localhost:8000")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation : {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database() 