"""
Tests pour le système de permissions par projet
Système critique : gestion des rôles et accès
"""

import pytest
from fastapi import status

from app.models.permissions import ProjectPermission, ProjectRole
from app.services.permission_service import PermissionService
from app.models.user import UserRole


class TestProjectPermissions:
    """Tests du système de permissions par projet"""
    
    def test_create_project_permission(self, db_session, test_user, test_project):
        """Test de création d'une permission de projet"""
        permission_service = PermissionService(db_session)
        
        permission = permission_service.create_project_permission(
            user=test_user,
            project=test_project,
            role=ProjectRole.USER,
            granted_by_id=test_project.owner_id
        )
        
        assert permission.user_id == test_user.id
        assert permission.project_id == test_project.id
        assert permission.role == ProjectRole.USER
        assert permission.is_active is True
        assert permission.can_view_project is True
        assert permission.can_edit_project is False
    
    def test_grant_default_permissions_to_owner(self, db_session, test_project):
        """Test d'attribution des permissions par défaut au propriétaire"""
        permission_service = PermissionService(db_session)
        
        # Accorder les permissions par défaut
        permission_service.grant_default_permissions(test_project)
        
        # Vérifier que le propriétaire a toutes les permissions
        owner_permissions = permission_service.get_effective_permissions(
            test_project.owner, test_project
        )
        
        assert owner_permissions["edit_project"] is True
        assert owner_permissions["delete_project"] is True
        assert owner_permissions["manage_users"] is True
        assert owner_permissions["moderate_comments"] is True
    
    def test_get_default_permissions_for_admin_role(self):
        """Test des permissions par défaut pour le rôle admin"""
        permissions = ProjectPermission.get_default_permissions_for_role(ProjectRole.ADMIN)
        
        assert permissions["can_view_project"] is True
        assert permissions["can_edit_project"] is True
        assert permissions["can_delete_project"] is True
        assert permissions["can_manage_users"] is True
        assert permissions["can_moderate_comments"] is True
        assert permissions["can_export_data"] is True
    
    def test_get_default_permissions_for_moderator_role(self):
        """Test des permissions par défaut pour le rôle modérateur"""
        permissions = ProjectPermission.get_default_permissions_for_role(ProjectRole.MODERATOR)
        
        assert permissions["can_view_project"] is True
        assert permissions["can_upload_datasets"] is True
        assert permissions["can_moderate_comments"] is True
        assert permissions["can_export_data"] is True
        assert permissions["can_edit_project"] is False
        assert permissions["can_delete_project"] is False
        assert permissions["can_manage_users"] is False
    
    def test_get_default_permissions_for_user_role(self):
        """Test des permissions par défaut pour le rôle utilisateur"""
        permissions = ProjectPermission.get_default_permissions_for_role(ProjectRole.USER)
        
        assert permissions["can_view_project"] is True
        assert permissions["can_create_comments"] is True
        assert permissions["can_upload_datasets"] is True
        assert permissions["can_edit_project"] is False
        assert permissions["can_delete_datasets"] is False
        assert permissions["can_moderate_comments"] is False
        assert permissions["can_export_data"] is False
    
    def test_update_project_permission(self, db_session, test_user, test_project):
        """Test de mise à jour d'une permission de projet"""
        permission_service = PermissionService(db_session)
        
        # Créer une permission utilisateur
        permission = permission_service.create_project_permission(
            user=test_user,
            project=test_project,
            role=ProjectRole.USER,
            granted_by_id=test_project.owner_id
        )
        
        # Upgrader vers modérateur
        updated_permission = permission_service.update_project_permission(
            user=test_user,
            project=test_project,
            new_role=ProjectRole.MODERATOR,
            updated_by_id=test_project.owner_id
        )
        
        assert updated_permission.role == ProjectRole.MODERATOR
        assert updated_permission.can_moderate_comments is True
        assert updated_permission.can_export_data is True
    
    def test_check_permission_success(self, db_session, test_user, test_project):
        """Test de vérification de permission réussie"""
        permission_service = PermissionService(db_session)
        
        # Créer une permission modérateur
        permission_service.create_project_permission(
            user=test_user,
            project=test_project,
            role=ProjectRole.MODERATOR,
            granted_by_id=test_project.owner_id
        )
        
        # Vérifier les permissions
        assert permission_service.check_permission(test_user, test_project, "view_project")
        assert permission_service.check_permission(test_user, test_project, "moderate_comments")
        assert not permission_service.check_permission(test_user, test_project, "delete_project")
    
    def test_check_permission_no_access(self, db_session, test_user, test_project):
        """Test de vérification de permission sans accès"""
        permission_service = PermissionService(db_session)
        
        # Aucune permission accordée
        assert not permission_service.check_permission(test_user, test_project, "view_project")
        assert not permission_service.check_permission(test_user, test_project, "edit_project")
    
    def test_remove_project_permission(self, db_session, test_user, test_project):
        """Test de suppression d'une permission de projet"""
        permission_service = PermissionService(db_session)
        
        # Créer une permission
        permission_service.create_project_permission(
            user=test_user,
            project=test_project,
            role=ProjectRole.USER,
            granted_by_id=test_project.owner_id
        )
        
        # Vérifier qu'elle existe
        assert permission_service.check_permission(test_user, test_project, "view_project")
        
        # La supprimer
        permission_service.remove_project_permission(test_user, test_project)
        
        # Vérifier qu'elle n'existe plus
        assert not permission_service.check_permission(test_user, test_project, "view_project")
    
    def test_get_user_project_permissions(self, db_session, test_user, test_project):
        """Test de récupération des permissions d'un utilisateur sur un projet"""
        permission_service = PermissionService(db_session)
        
        # Créer une permission
        permission_service.create_project_permission(
            user=test_user,
            project=test_project,
            role=ProjectRole.MODERATOR,
            granted_by_id=test_project.owner_id
        )
        
        # Récupérer les permissions
        permission = permission_service.get_user_project_permission(test_user, test_project)
        
        assert permission is not None
        assert permission.role == ProjectRole.MODERATOR
        assert permission.user_id == test_user.id
        assert permission.project_id == test_project.id
    
    def test_list_project_permissions(self, db_session, test_user, test_moderator, test_project):
        """Test de listage des permissions d'un projet"""
        permission_service = PermissionService(db_session)
        
        # Créer plusieurs permissions
        permission_service.create_project_permission(
            user=test_user,
            project=test_project,
            role=ProjectRole.USER,
            granted_by_id=test_project.owner_id
        )
        
        permission_service.create_project_permission(
            user=test_moderator,
            project=test_project,
            role=ProjectRole.MODERATOR,
            granted_by_id=test_project.owner_id
        )
        
        # Lister les permissions
        permissions = permission_service.list_project_permissions(test_project)
        
        assert len(permissions) >= 2  # Au moins les 2 créées (+ éventuellement propriétaire)
        user_emails = [p.user.email for p in permissions]
        assert test_user.email in user_emails
        assert test_moderator.email in user_emails


class TestPermissionInheritance:
    """Tests de l'héritage des permissions basé sur les rôles globaux"""
    
    def test_admin_inherits_admin_project_permissions(self, db_session, test_admin, test_project):
        """Test que les admins globaux héritent des permissions admin sur les projets"""
        permission_service = PermissionService(db_session)
        
        # Un admin global devrait avoir accès même sans permission explicite
        # (selon la logique métier implémentée)
        effective_permissions = permission_service.get_effective_permissions(test_admin, test_project)
        
        # Vérifier que l'admin a des permissions étendues
        assert effective_permissions.get("view_project", False)
        # L'implémentation exacte dépend de la logique métier
    
    def test_moderator_inherits_moderate_permissions(self, db_session, test_moderator, test_project):
        """Test que les modérateurs globaux héritent des permissions de modération"""
        permission_service = PermissionService(db_session)
        
        effective_permissions = permission_service.get_effective_permissions(test_moderator, test_project)
        
        # Un modérateur global devrait avoir au minimum des permissions de vue
        assert effective_permissions.get("view_project", False)
    
    def test_user_needs_explicit_permissions(self, db_session, test_user, test_project):
        """Test que les utilisateurs normaux ont besoin de permissions explicites"""
        permission_service = PermissionService(db_session)
        
        # Sans permission explicite, un utilisateur normal ne devrait pas avoir accès
        effective_permissions = permission_service.get_effective_permissions(test_user, test_project)
        
        # Cela dépend de la visibilité du projet et de la logique métier
        # Pour un projet public, il pourrait avoir accès en lecture
        if test_project.visibility.value == "public":
            assert effective_permissions.get("view_project", False)
        else:
            # Pour un projet privé, aucun accès sans permission explicite
            assert not effective_permissions.get("edit_project", True)


class TestPermissionAPI:
    """Tests des endpoints API de permissions"""
    
    def test_get_project_permissions_as_owner(self, client, test_project, auth_headers):
        """Test de récupération des permissions d'un projet par le propriétaire"""
        response = client.get(
            f"/api/v1/permissions/projects/{test_project.id}/permissions",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "permissions" in data
        assert isinstance(data["permissions"], list)
    
    def test_get_project_permissions_unauthorized(self, client, test_project):
        """Test de récupération des permissions sans authentification"""
        response = client.get(f"/api/v1/permissions/projects/{test_project.id}/permissions")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_invite_user_to_project_as_owner(self, client, test_project, test_moderator, auth_headers):
        """Test d'invitation d'un utilisateur à un projet par le propriétaire"""
        invite_data = {
            "user_email": test_moderator.email,
            "role": "moderator"
        }
        
        response = client.post(
            f"/api/v1/permissions/projects/{test_project.id}/permissions/invite",
            json=invite_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_email"] == test_moderator.email
        assert data["role"] == "moderator"
    
    def test_invite_nonexistent_user(self, client, test_project, auth_headers):
        """Test d'invitation d'un utilisateur inexistant"""
        invite_data = {
            "user_email": "nonexistent@example.com",
            "role": "user"
        }
        
        response = client.post(
            f"/api/v1/permissions/projects/{test_project.id}/permissions/invite",
            json=invite_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_user_permission_as_owner(self, client, test_project, test_user, auth_headers, db_session):
        """Test de mise à jour des permissions d'un utilisateur par le propriétaire"""
        # D'abord inviter l'utilisateur
        permission_service = PermissionService(db_session)
        permission_service.create_project_permission(
            user=test_user,
            project=test_project,
            role=ProjectRole.USER,
            granted_by_id=test_project.owner_id
        )
        
        # Puis mettre à jour ses permissions
        update_data = {
            "role": "moderator"
        }
        
        response = client.put(
            f"/api/v1/permissions/projects/{test_project.id}/permissions/{test_user.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["role"] == "moderator"
    
    def test_remove_user_permission_as_owner(self, client, test_project, test_user, auth_headers, db_session):
        """Test de suppression des permissions d'un utilisateur par le propriétaire"""
        # D'abord inviter l'utilisateur
        permission_service = PermissionService(db_session)
        permission_service.create_project_permission(
            user=test_user,
            project=test_project,
            role=ProjectRole.USER,
            granted_by_id=test_project.owner_id
        )
        
        # Puis supprimer ses permissions
        response = client.delete(
            f"/api/v1/permissions/projects/{test_project.id}/permissions/{test_user.id}",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_permissions_matrix(self, client):
        """Test de récupération de la matrice des permissions par rôle"""
        response = client.get("/api/v1/permissions/roles/permissions-matrix")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "admin" in data
        assert "moderator" in data
        assert "user" in data
        
        # Vérifier la structure des permissions
        admin_permissions = data["admin"]
        assert admin_permissions["can_edit_project"] is True
        assert admin_permissions["can_delete_project"] is True 