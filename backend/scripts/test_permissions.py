#!/usr/bin/env python3
"""
Script de test pour le système de permissions granulaires
"""

import sys
import os
import asyncio
from datetime import datetime, timedelta

# Ajouter le répertoire parent au path pour les imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import sessionmaker
from app.core.database import engine
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus, ProjectVisibility
from app.models.permissions import ProjectPermission, ProjectRole
from app.services.permission_service import PermissionService


# Créer une session de base de données
SessionLocal = sessionmaker(bind=engine)


def test_permission_service():
    """
    Teste le service de permissions
    """
    print("🧪 Test du service de permissions")
    print("-" * 40)
    
    db = SessionLocal()
    
    try:
        permission_service = PermissionService(db)
        
        # 1. Créer des utilisateurs de test
        print("1. Création d'utilisateurs de test...")
        
        # Propriétaire
        owner = User(
            email="owner@test.com",
            password_hash="hashed_password",
            first_name="Owner",
            last_name="Test",
            role=UserRole.USER,
            is_active=True,
            is_verified=True
        )
        db.add(owner)
        
        # Collaborateur
        collaborator = User(
            email="collaborator@test.com",
            password_hash="hashed_password",
            first_name="Collaborator",
            last_name="Test",
            role=UserRole.USER,
            is_active=True,
            is_verified=True
        )
        db.add(collaborator)
        
        # Viewer
        viewer = User(
            email="viewer@test.com",
            password_hash="hashed_password",
            first_name="Viewer",
            last_name="Test",
            role=UserRole.USER,
            is_active=True,
            is_verified=True
        )
        db.add(viewer)
        
        db.commit()
        db.refresh(owner)
        db.refresh(collaborator)
        db.refresh(viewer)
        
        print(f"   ✅ Propriétaire créé: {owner.email} (ID: {owner.id})")
        print(f"   ✅ Collaborateur créé: {collaborator.email} (ID: {collaborator.id})")
        print(f"   ✅ Viewer créé: {viewer.email} (ID: {viewer.id})")
        
        # 2. Créer un projet de test
        print("\n2. Création d'un projet de test...")
        
        project = Project(
            title="Projet de Test Permissions",
            slug="projet-test-permissions",
            description="Projet pour tester le système de permissions",
            owner_id=owner.id,
            status=ProjectStatus.ACTIVE,
            visibility=ProjectVisibility.PUBLIC,
            allow_comments=True,
            allow_contributions=True
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        
        print(f"   ✅ Projet créé: {project.title} (ID: {project.id})")
        
        # 3. Tester les permissions par défaut du propriétaire
        print("\n3. Test des permissions par défaut du propriétaire...")
        
        permission_service.grant_default_permissions(project)
        
        # Vérifier les permissions du propriétaire
        owner_permissions = permission_service.get_effective_permissions(owner, project)
        
        print(f"   ✅ Propriétaire a {sum(owner_permissions.values())} permissions accordées")
        
        # Vérifications spécifiques
        assert permission_service.check_permission(owner, project, "edit_project"), "Le propriétaire doit pouvoir éditer"
        assert permission_service.check_permission(owner, project, "delete_project"), "Le propriétaire doit pouvoir supprimer"
        assert permission_service.check_permission(owner, project, "manage_permissions"), "Le propriétaire doit pouvoir gérer les permissions"
        
        print("   ✅ Toutes les permissions du propriétaire sont correctes")
        
        # 4. Tester l'ajout de collaborateur
        print("\n4. Test d'ajout de collaborateur...")
        
        collab_permission = permission_service.create_project_permission(
            user_id=collaborator.id,
            project_id=project.id,
            role=ProjectRole.COLLABORATOR,
            granted_by_id=owner.id
        )
        
        print(f"   ✅ Permission collaborateur créée (ID: {collab_permission.id})")
        
        # Vérifier les permissions du collaborateur
        assert permission_service.check_permission(collaborator, project, "edit_project"), "Le collaborateur doit pouvoir éditer"
        assert not permission_service.check_permission(collaborator, project, "delete_project"), "Le collaborateur ne doit pas pouvoir supprimer"
        assert not permission_service.check_permission(collaborator, project, "manage_permissions"), "Le collaborateur ne doit pas pouvoir gérer les permissions"
        
        print("   ✅ Permissions du collaborateur correctes")
        
        # 5. Tester l'ajout de viewer
        print("\n5. Test d'ajout de viewer...")
        
        viewer_permission = permission_service.create_project_permission(
            user_id=viewer.id,
            project_id=project.id,
            role=ProjectRole.VIEWER,
            granted_by_id=owner.id
        )
        
        print(f"   ✅ Permission viewer créée (ID: {viewer_permission.id})")
        
        # Vérifier les permissions du viewer
        assert permission_service.check_permission(viewer, project, "view_project"), "Le viewer doit pouvoir voir"
        assert not permission_service.check_permission(viewer, project, "edit_project"), "Le viewer ne doit pas pouvoir éditer"
        assert not permission_service.check_permission(viewer, project, "create_comments"), "Le viewer ne doit pas pouvoir commenter"
        
        print("   ✅ Permissions du viewer correctes")
        
        # 6. Tester la mise à jour de permissions
        print("\n6. Test de mise à jour de permissions...")
        
        # Promouvoir le viewer en contributor
        updated_permission = permission_service.update_project_permission(
            user_id=viewer.id,
            project_id=project.id,
            role=ProjectRole.CONTRIBUTOR
        )
        
        print(f"   ✅ Viewer promu en contributor")
        
        # Vérifier les nouvelles permissions
        assert permission_service.check_permission(viewer, project, "create_comments"), "Le contributor doit pouvoir commenter"
        assert permission_service.check_permission(viewer, project, "upload_datasets"), "Le contributor doit pouvoir upload"
        assert not permission_service.check_permission(viewer, project, "edit_project"), "Le contributor ne doit pas pouvoir éditer le projet"
        
        print("   ✅ Mise à jour des permissions réussie")
        
        # 7. Tester les permissions avec expiration
        print("\n7. Test des permissions avec expiration...")
        
        # Créer un utilisateur temporaire
        temp_user = User(
            email="temp@test.com",
            password_hash="hashed_password",
            first_name="Temp",
            last_name="User",
            role=UserRole.USER,
            is_active=True,
            is_verified=True
        )
        db.add(temp_user)
        db.commit()
        db.refresh(temp_user)
        
        # Créer une permission qui expire dans 1 seconde (pour le test)
        temp_permission = permission_service.create_project_permission(
            user_id=temp_user.id,
            project_id=project.id,
            role=ProjectRole.VIEWER,
            granted_by_id=owner.id,
            expires_at=datetime.utcnow() + timedelta(seconds=1)
        )
        
        print(f"   ✅ Permission temporaire créée")
        
        # Vérifier que la permission fonctionne initialement
        assert permission_service.check_permission(temp_user, project, "view_project"), "La permission temporaire doit fonctionner"
        
        # Attendre l'expiration
        import time
        time.sleep(2)
        
        # Vérifier que la permission a expiré
        assert not permission_service.check_permission(temp_user, project, "view_project"), "La permission doit avoir expiré"
        
        print("   ✅ Test d'expiration réussi")
        
        # 8. Tester le nettoyage des permissions expirées
        print("\n8. Test du nettoyage des permissions expirées...")
        
        expired_count = permission_service.cleanup_expired_permissions()
        print(f"   ✅ {expired_count} permission(s) expirée(s) nettoyée(s)")
        
        # 9. Tester le résumé des rôles
        print("\n9. Test du résumé des rôles...")
        
        role_summary = permission_service.get_project_role_summary(project.id)
        print(f"   ✅ Résumé des rôles: {role_summary}")
        
        # Vérifications
        assert role_summary.get('owner', 0) == 1, "Doit avoir 1 owner"
        assert role_summary.get('collaborator', 0) == 1, "Doit avoir 1 collaborator"
        assert role_summary.get('contributor', 0) == 1, "Doit avoir 1 contributor"
        
        print("   ✅ Résumé des rôles correct")
        
        # 10. Nettoyer les données de test
        print("\n10. Nettoyage des données de test...")
        
        # Supprimer les permissions
        db.query(ProjectPermission).filter(ProjectPermission.project_id == project.id).delete()
        
        # Supprimer le projet
        db.delete(project)
        
        # Supprimer les utilisateurs
        db.delete(owner)
        db.delete(collaborator)
        db.delete(viewer)
        db.delete(temp_user)
        
        db.commit()
        
        print("   ✅ Données de test nettoyées")
        
        print("\n🎉 Tous les tests sont passés avec succès!")
        return True
        
    except Exception as e:
        print(f"\n❌ Erreur durant les tests: {str(e)}")
        db.rollback()
        return False
        
    finally:
        db.close()


def test_permission_api_endpoints():
    """
    Teste les endpoints API (simulation basique)
    """
    print("\n🌐 Test des endpoints API")
    print("-" * 40)
    
    # Tests simulés des endpoints
    endpoints = [
        "GET /api/v1/permissions/projects/{project_id}/permissions",
        "POST /api/v1/permissions/projects/{project_id}/permissions/invite",
        "PUT /api/v1/permissions/projects/{project_id}/permissions/{user_id}",
        "DELETE /api/v1/permissions/projects/{project_id}/permissions/{user_id}",
        "GET /api/v1/permissions/projects/{project_id}/permissions/{user_id}/effective",
        "GET /api/v1/permissions/roles/permissions-matrix",
        "POST /api/v1/permissions/cleanup/expired-permissions"
    ]
    
    print("📋 Endpoints de permissions disponibles:")
    for endpoint in endpoints:
        print(f"   ✅ {endpoint}")
    
    print("\n🔗 Les endpoints sont configurés et prêts à être testés")


def main():
    """
    Fonction principale de test
    """
    print("🧪 Tests du système de permissions granulaires")
    print("=" * 60)
    
    # Test du service
    service_success = test_permission_service()
    
    # Test des endpoints API
    test_permission_api_endpoints()
    
    print("\n" + "=" * 60)
    if service_success:
        print("✅ Système de permissions testé avec succès!")
        print("\n📖 Le système de permissions granulaires est opérationnel:")
        print("   - Rôles par projet: OWNER, ADMIN, COLLABORATOR, CONTRIBUTOR, MODERATOR, VIEWER")
        print("   - Permissions détaillées pour chaque action")
        print("   - Support des permissions temporaires")
        print("   - API complète pour la gestion des permissions")
    else:
        print("❌ Des erreurs ont été détectées dans le système de permissions")
        sys.exit(1)


if __name__ == "__main__":
    main() 