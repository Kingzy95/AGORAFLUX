#!/usr/bin/env python3
"""
Script de test pour vérifier les KPI de collaboration
"""

import sys
import os
import asyncio

# Ajouter le répertoire parent au PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus, ProjectVisibility
from app.models.comment import Comment, CommentType, CommentStatus
from app.api.collaboration import get_collaboration_stats
from app.api.dependencies import get_current_user
from datetime import datetime, timedelta

def create_test_data():
    """Créer des données de test pour les KPI"""
    db = SessionLocal()
    
    try:
        # Créer un utilisateur de test s'il n'existe pas
        test_user = db.query(User).filter(User.email == "test@agoraflux.com").first()
        if not test_user:
            test_user = User(
                email="test@agoraflux.com",
                first_name="Test",
                last_name="User",
                role=UserRole.ADMIN,
                password_hash="test_hash",  # Corrigé: password_hash au lieu de hashed_password
                is_active=True,
                is_verified=True,
                last_login=datetime.now()
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"✅ Utilisateur de test créé: {test_user.email}")

        # Créer un projet de test s'il n'existe pas
        test_project = db.query(Project).filter(Project.title == "Projet Test KPI").first()
        if not test_project:
            test_project = Project(
                title="Projet Test KPI",
                slug="projet-test-kpi",  # Ajout du slug requis
                description="Projet pour tester les KPI de collaboration",
                status=ProjectStatus.ACTIVE,
                visibility=ProjectVisibility.PUBLIC,
                owner_id=test_user.id
            )
            db.add(test_project)
            db.commit()
            db.refresh(test_project)
            print(f"✅ Projet de test créé: {test_project.title}")

        # Créer des commentaires de test
        existing_comments = db.query(Comment).filter(Comment.project_id == test_project.id).count()
        if existing_comments == 0:
            comments_data = [
                {"content": "Excellente initiative!", "type": CommentType.COMMENT, "status": CommentStatus.ACTIVE},
                {"content": "Quelle est la timeline prévue?", "type": CommentType.QUESTION, "status": CommentStatus.ACTIVE},
                {"content": "Je suggère d'ajouter plus de détails", "type": CommentType.SUGGESTION, "status": CommentStatus.ACTIVE},
                {"content": "Commentaire résolu", "type": CommentType.COMMENT, "status": CommentStatus.HIDDEN},
                {"content": "Autre suggestion", "type": CommentType.SUGGESTION, "status": CommentStatus.FLAGGED}
            ]
            
            for i, comment_data in enumerate(comments_data):
                comment = Comment(
                    project_id=test_project.id,
                    author_id=test_user.id,
                    content=comment_data["content"],
                    type=comment_data["type"],
                    status=comment_data["status"],
                    likes_count=i + 1,
                    replies_count=i * 2,
                    created_at=datetime.now() - timedelta(days=i),
                    updated_at=datetime.now() - timedelta(hours=i)
                )
                db.add(comment)
            
            db.commit()
            print(f"✅ {len(comments_data)} commentaires de test créés")

    except Exception as e:
        print(f"❌ Erreur lors de la création des données: {e}")
        db.rollback()
    finally:
        db.close()

async def test_collaboration_stats():
    """Tester l'endpoint de statistiques de collaboration"""
    db = SessionLocal()
    
    try:
        # Récupérer l'utilisateur de test
        test_user = db.query(User).filter(User.email == "test@agoraflux.com").first()
        if not test_user:
            print("❌ Utilisateur de test non trouvé")
            return
        
        # Tester l'endpoint de statistiques
        print("\n📊 Test des statistiques de collaboration...")
        
        # Simuler la fonction get_collaboration_stats
        stats = await get_collaboration_stats(
            project_id=None,
            current_user=test_user,
            db=db
        )
        
        print(f"📈 Total annotations: {stats.total_annotations}")
        print(f"🔄 Discussions actives: {stats.active_discussions}")
        print(f"✅ Discussions résolues: {stats.resolved_discussions}")
        print(f"👥 Total participants: {stats.total_participants}")
        print(f"💬 Total réponses: {stats.total_replies}")
        print(f"⏱️ Temps de réponse moyen: {stats.avg_response_time}")
        print(f"📊 Taux de participation: {stats.participation_rate}%")
        print(f"🏆 Top contributeurs: {len(stats.top_contributors)}")
        
        for contrib in stats.top_contributors[:3]:
            print(f"   - {contrib['user_name']}: {contrib['contribution_count']} contributions ({contrib['user_role']})")
        
        # Vérifications
        if stats.total_annotations > 0:
            print("✅ Les KPI affichent des données réelles!")
        else:
            print("⚠️ Aucune annotation trouvée")
            
        if stats.active_discussions + stats.resolved_discussions == stats.total_annotations:
            print("✅ Cohérence des statistiques vérifiée")
        else:
            print("⚠️ Incohérence détectée dans les statistiques")
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

async def main():
    """Fonction principale"""
    print("🧪 TEST DES KPI DE COLLABORATION")
    print("=" * 50)
    
    # Créer les données de test
    print("1️⃣ Création des données de test...")
    create_test_data()
    
    # Tester les statistiques
    print("\n2️⃣ Test des statistiques...")
    await test_collaboration_stats()
    
    print("\n🎉 Test terminé!")

if __name__ == "__main__":
    asyncio.run(main()) 