"""
Routes API pour la gestion des permissions simplifiées (3 rôles)
Focus sur la sécurité selon les exigences : admin/modérateur/utilisateur
"""

from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import get_current_user, require_admin, require_moderator_or_admin
from app.services.permission_service import PermissionService
from app.models.user import User
from app.models.project import Project
from app.models.permissions import ProjectRole
from app.schemas.permissions import (
    ProjectPermissionCreate,
    ProjectPermissionUpdate,
    ProjectPermissionResponse,
    ProjectPermissionsList,
    EffectivePermissions,
    InviteUserRequest,
    RolePermissionsMatrix,
    UserProjectAccess
)


router = APIRouter()


@router.get("/projects/{project_id}/access", response_model=UserProjectAccess)
async def check_project_access(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Vérifie l'accès d'un utilisateur à un projet
    """
    permission_service = PermissionService(db)
    
    # Vérifier que le projet existe
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Vérifier l'accès
    can_access = permission_service.can_access_project(current_user, project)
    effective_role = permission_service.get_effective_project_role(current_user, project)
    
    # Déterminer la raison de l'accès
    access_reason = "no_access"
    if can_access:
        if project.owner_id == current_user.id:
            access_reason = "owner"
        elif current_user.role.value == "admin":
            access_reason = "global_admin"
        elif current_user.role.value == "moderateur":
            access_reason = "global_moderator"
        elif project.visibility.value == "public":
            access_reason = "public_project"
        else:
            access_reason = "explicit_permission"
    
    return UserProjectAccess(
        can_access=can_access,
        effective_role=effective_role,
        access_reason=access_reason
    )


@router.get("/projects/{project_id}/permissions", response_model=ProjectPermissionsList)
async def get_project_permissions(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère toutes les permissions pour un projet
    Sécurisé : seuls les admins du projet et admins globaux
    """
    permission_service = PermissionService(db)
    
    # Vérifier que le projet existe
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Vérifier les permissions (admins du projet ou admins globaux)
    permission_service.require_permission(current_user, project, "manage_users")
    
    # Récupérer les permissions
    permissions = permission_service.get_project_permissions(project_id)
    role_summary = permission_service.get_project_role_summary(project_id)
    
    # Formater les permissions pour la réponse
    formatted_permissions = []
    for perm in permissions:
        formatted_permissions.append(ProjectPermissionResponse(
            id=perm.id,
            user={
                "id": perm.user.id,
                "email": perm.user.email,
                "first_name": perm.user.first_name,
                "last_name": perm.user.last_name,
                "role": perm.user.role.value
            },
            project_id=perm.project_id,
            role=perm.role,
            can_view_project=perm.can_view_project,
            can_view_datasets=perm.can_view_datasets,
            can_view_comments=perm.can_view_comments,
            can_edit_project=perm.can_edit_project,
            can_delete_project=perm.can_delete_project,
            can_upload_datasets=perm.can_upload_datasets,
            can_delete_datasets=perm.can_delete_datasets,
            can_create_comments=perm.can_create_comments,
            can_edit_comments=perm.can_edit_comments,
            can_delete_comments=perm.can_delete_comments,
            can_moderate_comments=perm.can_moderate_comments,
            can_manage_users=perm.can_manage_users,
            can_export_data=perm.can_export_data,
            granted_by={
                "id": perm.granted_by.id,
                "email": perm.granted_by.email,
                "first_name": perm.granted_by.first_name,
                "last_name": perm.granted_by.last_name
            } if perm.granted_by else None,
            granted_at=perm.granted_at,
            expires_at=perm.expires_at,
            is_active=perm.is_active,
            is_expired=perm.is_expired
        ))
    
    return ProjectPermissionsList(
        project_id=project_id,
        permissions=formatted_permissions,
        role_summary=role_summary,
        total_users=len(formatted_permissions)
    )


@router.post("/projects/{project_id}/permissions/invite", response_model=ProjectPermissionResponse)
async def invite_user_to_project(
    project_id: int,
    invite_data: InviteUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Invite un utilisateur à rejoindre un projet
    Sécurisé : seuls les admins du projet et admins globaux
    """
    permission_service = PermissionService(db)
    
    # Inviter l'utilisateur
    permission = permission_service.invite_user_to_project(
        project_id=project_id,
        user_email=invite_data.user_email,
        role=invite_data.role,
        invited_by=current_user,
        expires_in_days=invite_data.expires_in_days
    )
    
    # TODO: Envoyer une notification/email à l'utilisateur invité
    
    return ProjectPermissionResponse(
        id=permission.id,
        user={
            "id": permission.user.id,
            "email": permission.user.email,
            "first_name": permission.user.first_name,
            "last_name": permission.user.last_name,
            "role": permission.user.role.value
        },
        project_id=permission.project_id,
        role=permission.role,
        can_view_project=permission.can_view_project,
        can_view_datasets=permission.can_view_datasets,
        can_view_comments=permission.can_view_comments,
        can_edit_project=permission.can_edit_project,
        can_delete_project=permission.can_delete_project,
        can_upload_datasets=permission.can_upload_datasets,
        can_delete_datasets=permission.can_delete_datasets,
        can_create_comments=permission.can_create_comments,
        can_edit_comments=permission.can_edit_comments,
        can_delete_comments=permission.can_delete_comments,
        can_moderate_comments=permission.can_moderate_comments,
        can_manage_users=permission.can_manage_users,
        can_export_data=permission.can_export_data,
        granted_by={
            "id": permission.granted_by.id,
            "email": permission.granted_by.email,
            "first_name": permission.granted_by.first_name,
            "last_name": permission.granted_by.last_name
        } if permission.granted_by else None,
        granted_at=permission.granted_at,
        expires_at=permission.expires_at,
        is_active=permission.is_active,
        is_expired=permission.is_expired
    )


@router.put("/projects/{project_id}/permissions/{user_id}", response_model=ProjectPermissionResponse)
async def update_user_permission(
    project_id: int,
    user_id: int,
    update_data: ProjectPermissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Met à jour les permissions d'un utilisateur sur un projet
    Sécurisé : seuls les admins du projet et admins globaux
    """
    permission_service = PermissionService(db)
    
    # Vérifier que le projet existe
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Vérifier les permissions
    permission_service.require_permission(current_user, project, "manage_users")
    
    # Mettre à jour la permission
    permission = permission_service.update_project_permission(
        user_id=user_id,
        project_id=project_id,
        role=update_data.role,
        expires_at=update_data.expires_at,
        updated_by_id=current_user.id
    )
    
    return ProjectPermissionResponse(
        id=permission.id,
        user={
            "id": permission.user.id,
            "email": permission.user.email,
            "first_name": permission.user.first_name,
            "last_name": permission.user.last_name,
            "role": permission.user.role.value
        },
        project_id=permission.project_id,
        role=permission.role,
        can_view_project=permission.can_view_project,
        can_view_datasets=permission.can_view_datasets,
        can_view_comments=permission.can_view_comments,
        can_edit_project=permission.can_edit_project,
        can_delete_project=permission.can_delete_project,
        can_upload_datasets=permission.can_upload_datasets,
        can_delete_datasets=permission.can_delete_datasets,
        can_create_comments=permission.can_create_comments,
        can_edit_comments=permission.can_edit_comments,
        can_delete_comments=permission.can_delete_comments,
        can_moderate_comments=permission.can_moderate_comments,
        can_manage_users=permission.can_manage_users,
        can_export_data=permission.can_export_data,
        granted_by={
            "id": permission.granted_by.id,
            "email": permission.granted_by.email,
            "first_name": permission.granted_by.first_name,
            "last_name": permission.granted_by.last_name
        } if permission.granted_by else None,
        granted_at=permission.granted_at,
        expires_at=permission.expires_at,
        is_active=permission.is_active,
        is_expired=permission.is_expired
    )


@router.delete("/projects/{project_id}/permissions/{user_id}")
async def remove_user_permission(
    project_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Supprime les permissions d'un utilisateur sur un projet
    Sécurisé : seuls les admins du projet et admins globaux
    """
    permission_service = PermissionService(db)
    
    # Vérifier que le projet existe
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Vérifier les permissions
    permission_service.require_permission(current_user, project, "manage_users")
    
    # Empêcher la suppression du propriétaire
    if user_id == project.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de supprimer les permissions du propriétaire"
        )
    
    # Supprimer la permission
    success = permission_service.remove_project_permission(user_id, project_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission non trouvée"
        )
    
    return {"message": "Permission supprimée avec succès"}


@router.get("/projects/{project_id}/permissions/{user_id}/effective", response_model=EffectivePermissions)
async def get_user_effective_permissions(
    project_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les permissions effectives d'un utilisateur sur un projet
    """
    permission_service = PermissionService(db)
    
    # Vérifier que le projet existe
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Vérifier que l'utilisateur existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Vérifier les permissions (admins du projet ou l'utilisateur lui-même)
    if current_user.id != user_id:
        permission_service.require_permission(current_user, project, "manage_users")
    
    # Récupérer les permissions effectives
    effective_permissions = permission_service.get_effective_permissions(user, project)
    effective_role = permission_service.get_effective_project_role(user, project)
    
    return EffectivePermissions(
        user_id=user_id,
        project_id=project_id,
        effective_role=effective_role,
        is_owner=project.owner_id == user_id,
        is_global_admin=user.role.value == "admin",
        is_global_moderator=user.role.value == "moderateur",
        permissions=effective_permissions
    )


@router.get("/roles/permissions-matrix", response_model=List[RolePermissionsMatrix])
async def get_roles_permissions_matrix():
    """
    Récupère la matrice des permissions par rôle (3 rôles simplifiés)
    """
    from app.models.permissions import ProjectPermission
    
    roles_matrix = []
    
    role_descriptions = {
        ProjectRole.ADMIN: "Administrateur du projet avec tous les droits",
        ProjectRole.MODERATOR: "Modérateur avec droits de modération et contribution", 
        ProjectRole.USER: "Utilisateur standard avec droits de base"
    }
    
    for role in ProjectRole:
        default_permissions = ProjectPermission.get_default_permissions_for_role(role)
        roles_matrix.append(RolePermissionsMatrix(
            role=role,
            permissions=default_permissions,
            description=role_descriptions.get(role, "")
        ))
    
    return roles_matrix


@router.post("/cleanup/expired-permissions")
async def cleanup_expired_permissions(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Nettoie les permissions expirées (admin global seulement)
    Route sécurisée selon les exigences
    """
    permission_service = PermissionService(db)
    expired_count = permission_service.cleanup_expired_permissions()
    
    return {
        "message": f"{expired_count} permissions expirées nettoyées",
        "expired_count": expired_count
    } 