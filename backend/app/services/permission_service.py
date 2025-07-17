"""
Service de gestion des permissions simplifiées pour AgoraFlux
Système basé sur 3 rôles : admin/modérateur/utilisateur
"""

from typing import Optional, List, Dict, Union
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from loguru import logger

from app.models.user import User, UserRole
from app.models.project import Project
from app.models.permissions import ProjectPermission, ProjectRole


class PermissionService:
    """
    Service de gestion des permissions par projet (simplifié)
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_project_permission(self, user_id: int, project_id: int) -> Optional[ProjectPermission]:
        """
        Récupère les permissions d'un utilisateur sur un projet
        """
        return self.db.query(ProjectPermission).filter(
            and_(
                ProjectPermission.user_id == user_id,
                ProjectPermission.project_id == project_id,
                ProjectPermission.is_active == True
            )
        ).first()
    
    def get_effective_project_role(self, user: User, project: Project) -> ProjectRole:
        """
        Détermine le rôle effectif d'un utilisateur sur un projet
        Combine le rôle global et les permissions spécifiques au projet
        """
        # 1. Les admins globaux sont automatiquement admins du projet
        if user.role == UserRole.ADMIN:
            return ProjectRole.ADMIN
        
        # 2. Le propriétaire du projet est automatiquement admin
        if project.owner_id == user.id:
            return ProjectRole.ADMIN
        
        # 3. Vérifier les permissions spécifiques au projet
        project_permission = self.get_user_project_permission(user.id, project.id)
        if project_permission and not project_permission.is_expired:
            return project_permission.role
        
        # 4. Les modérateurs globaux sont modérateurs par défaut sur les projets publics
        if user.role == UserRole.MODERATOR and project.visibility.value == "public":
            return ProjectRole.MODERATOR
        
        # 5. Les utilisateurs standards sont des utilisateurs simples par défaut sur les projets publics
        if project.visibility.value == "public":
            return ProjectRole.USER
        
        # 6. Aucun accès pour les projets privés sans permission explicite
        return None
    
    def create_project_permission(
        self,
        user_id: int,
        project_id: int,
        role: ProjectRole,
        granted_by_id: int,
        expires_at: Optional[datetime] = None
    ) -> ProjectPermission:
        """
        Crée une nouvelle permission de projet pour un utilisateur
        """
        # Vérifier si une permission existe déjà
        existing = self.get_user_project_permission(user_id, project_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="L'utilisateur a déjà des permissions sur ce projet"
            )
        
        # Créer la nouvelle permission
        permission = ProjectPermission(
            user_id=user_id,
            project_id=project_id,
            role=role,
            granted_by_id=granted_by_id,
            expires_at=expires_at
        )
        
        # Appliquer les permissions par défaut du rôle
        permission.apply_role_permissions()
        
        self.db.add(permission)
        self.db.commit()
        self.db.refresh(permission)
        
        logger.info(f"Permission créée: user {user_id} -> project {project_id} avec rôle {role.value}")
        return permission
    
    def update_project_permission(
        self,
        user_id: int,
        project_id: int,
        role: Optional[ProjectRole] = None,
        expires_at: Optional[datetime] = None,
        updated_by_id: Optional[int] = None
    ) -> ProjectPermission:
        """
        Met à jour les permissions d'un utilisateur sur un projet
        """
        permission = self.get_user_project_permission(user_id, project_id)
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Permission non trouvée"
            )
        
        # Mettre à jour le rôle si fourni
        if role:
            permission.role = role
            permission.apply_role_permissions()
        
        # Mettre à jour l'expiration
        if expires_at is not None:
            permission.expires_at = expires_at
        
        if updated_by_id:
            permission.granted_by_id = updated_by_id
        
        self.db.commit()
        self.db.refresh(permission)
        
        logger.info(f"Permission mise à jour: user {user_id} -> project {project_id}")
        return permission
    
    def remove_project_permission(self, user_id: int, project_id: int) -> bool:
        """
        Supprime les permissions d'un utilisateur sur un projet
        """
        permission = self.get_user_project_permission(user_id, project_id)
        if not permission:
            return False
        
        self.db.delete(permission)
        self.db.commit()
        
        logger.info(f"Permission supprimée: user {user_id} -> project {project_id}")
        return True
    
    def check_permission(
        self,
        user: User,
        project: Project,
        permission: str,
        allow_global_admin: bool = True
    ) -> bool:
        """
        Vérifie si un utilisateur a une permission spécifique sur un projet
        """
        # Les admins globaux ont toutes les permissions (sauf si explicitement refusé)
        if allow_global_admin and user.role == UserRole.ADMIN:
            return True
        
        # Obtenir le rôle effectif de l'utilisateur sur ce projet
        effective_role = self.get_effective_project_role(user, project)
        
        if not effective_role:
            return False
        
        # Vérifier les permissions spécifiques au projet si elles existent
        project_permission = self.get_user_project_permission(user.id, project.id)
        if project_permission and not project_permission.is_expired:
            return project_permission.has_permission(permission)
        
        # Sinon, utiliser les permissions par défaut du rôle effectif
        default_permissions = ProjectPermission.get_default_permissions_for_role(effective_role)
        return default_permissions.get(f"can_{permission}", False)
    
    def require_permission(
        self,
        user: User,
        project: Project,
        permission: str,
        allow_global_admin: bool = True
    ) -> None:
        """
        Vérifie qu'un utilisateur a une permission et lève une exception sinon
        """
        if not self.check_permission(user, project, permission, allow_global_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission requise : {permission}"
            )
    
    def grant_default_permissions(self, project: Project) -> None:
        """
        Accorde les permissions par défaut au propriétaire d'un nouveau projet
        """
        # Le propriétaire obtient automatiquement le rôle admin via get_effective_project_role
        # Mais on peut créer une permission explicite si nécessaire
        existing = self.get_user_project_permission(project.owner_id, project.id)
        if not existing:
            self.create_project_permission(
                user_id=project.owner_id,
                project_id=project.id,
                role=ProjectRole.ADMIN,
                granted_by_id=project.owner_id
            )
    
    def invite_user_to_project(
        self,
        project_id: int,
        user_email: str,
        role: ProjectRole,
        invited_by: User,
        expires_in_days: Optional[int] = None
    ) -> ProjectPermission:
        """
        Invite un utilisateur à rejoindre un projet
        """
        # Vérifier que l'inviteur a le droit d'inviter
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projet non trouvé"
            )
        
        self.require_permission(invited_by, project, "manage_users")
        
        # Vérifier que l'utilisateur existe
        user = self.db.query(User).filter(User.email == user_email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        # Calculer l'expiration
        expires_at = None
        if expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        # Créer la permission
        return self.create_project_permission(
            user_id=user.id,
            project_id=project_id,
            role=role,
            granted_by_id=invited_by.id,
            expires_at=expires_at
        )
    
    def get_project_permissions(self, project_id: int) -> List[ProjectPermission]:
        """
        Récupère toutes les permissions pour un projet
        """
        return self.db.query(ProjectPermission).filter(
            and_(
                ProjectPermission.project_id == project_id,
                ProjectPermission.is_active == True
            )
        ).all()
    
    def get_project_role_summary(self, project_id: int) -> Dict[str, int]:
        """
        Retourne un résumé des rôles pour un projet
        """
        permissions = self.get_project_permissions(project_id)
        summary = {}
        
        for role in ProjectRole:
            count = len([p for p in permissions if p.role == role])
            summary[role.value] = count
        
        return summary
    
    def cleanup_expired_permissions(self) -> int:
        """
        Nettoie les permissions expirées
        """
        expired_count = self.db.query(ProjectPermission).filter(
            and_(
                ProjectPermission.expires_at < datetime.utcnow(),
                ProjectPermission.is_active == True
            )
        ).update({"is_active": False})
        
        self.db.commit()
        
        if expired_count > 0:
            logger.info(f"Nettoyage: {expired_count} permissions expirées désactivées")
        
        return expired_count
    
    def get_effective_permissions(self, user: User, project: Project) -> Dict[str, bool]:
        """
        Retourne toutes les permissions effectives d'un utilisateur sur un projet
        """
        permissions = {}
        
        # Liste de toutes les permissions possibles (simplifiée)
        permission_list = [
            "view_project", "view_datasets", "view_comments",
            "edit_project", "delete_project", "upload_datasets", "delete_datasets",
            "create_comments", "edit_comments", "delete_comments", "moderate_comments",
            "manage_users", "export_data"
        ]
        
        for permission in permission_list:
            permissions[permission] = self.check_permission(user, project, permission)
        
        return permissions
    
    def can_access_project(self, user: User, project: Project) -> bool:
        """
        Vérifie si un utilisateur peut accéder à un projet
        """
        # Admins globaux peuvent tout voir
        if user.role == UserRole.ADMIN:
            return True
        
        # Propriétaire peut voir son projet
        if project.owner_id == user.id:
            return True
        
        # Projets publics accessibles à tous les utilisateurs connectés
        if project.visibility.value == "public":
            return True
        
        # Projets privés : vérifier les permissions explicites
        if project.visibility.value == "private":
            permission = self.get_user_project_permission(user.id, project.id)
            return permission is not None and not permission.is_expired
        
        # Projets restreints : modérateurs + permissions explicites
        if project.visibility.value == "restricted":
            if user.role == UserRole.MODERATOR:
                return True
            permission = self.get_user_project_permission(user.id, project.id)
            return permission is not None and not permission.is_expired
        
        return False 