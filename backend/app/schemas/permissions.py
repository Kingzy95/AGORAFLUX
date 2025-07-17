"""
Schémas Pydantic pour les permissions simplifiées (3 rôles)
"""

from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.permissions import ProjectRole


class ProjectPermissionBase(BaseModel):
    """Schéma de base pour les permissions de projet"""
    role: ProjectRole
    expires_at: Optional[datetime] = None


class ProjectPermissionCreate(ProjectPermissionBase):
    """Schéma pour la création d'une permission de projet"""
    user_email: str = Field(..., description="Email de l'utilisateur")
    expires_in_days: Optional[int] = Field(None, ge=1, le=365)


class ProjectPermissionUpdate(BaseModel):
    """Schéma pour la mise à jour d'une permission de projet"""
    role: Optional[ProjectRole] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class UserInfo(BaseModel):
    """Informations utilisateur pour les permissions"""
    id: int
    email: str
    first_name: str
    last_name: str
    role: str  # Rôle global (admin/moderateur/utilisateur)

    class Config:
        from_attributes = True


class GrantedByInfo(BaseModel):
    """Informations sur qui a accordé la permission"""
    id: int
    email: str
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


class ProjectPermissionResponse(BaseModel):
    """Schéma de réponse pour une permission de projet"""
    id: int
    user: UserInfo
    project_id: int
    role: ProjectRole
    
    # Permissions essentielles (simplifiées)
    can_view_project: bool
    can_view_datasets: bool
    can_view_comments: bool
    can_edit_project: bool
    can_delete_project: bool
    can_upload_datasets: bool
    can_delete_datasets: bool
    can_create_comments: bool
    can_edit_comments: bool
    can_delete_comments: bool
    can_moderate_comments: bool
    can_manage_users: bool
    can_export_data: bool
    
    # Métadonnées
    granted_by: Optional[GrantedByInfo] = None
    granted_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool
    is_expired: bool

    class Config:
        from_attributes = True


class ProjectPermissionsList(BaseModel):
    """Liste des permissions d'un projet"""
    project_id: int
    permissions: List[ProjectPermissionResponse]
    role_summary: Dict[str, int]
    total_users: int


class EffectivePermissions(BaseModel):
    """Permissions effectives d'un utilisateur sur un projet"""
    user_id: int
    project_id: int
    effective_role: Optional[ProjectRole] = None
    is_owner: bool
    is_global_admin: bool
    is_global_moderator: bool
    permissions: Dict[str, bool]


class InviteUserRequest(BaseModel):
    """Requête pour inviter un utilisateur à un projet"""
    user_email: str = Field(..., description="Email de l'utilisateur à inviter")
    role: ProjectRole = Field(..., description="Rôle à accorder")
    expires_in_days: Optional[int] = Field(None, ge=1, le=365, description="Expiration en jours")
    message: Optional[str] = Field(None, max_length=500, description="Message d'invitation")


class RolePermissionsMatrix(BaseModel):
    """Matrice des permissions par rôle"""
    role: ProjectRole
    permissions: Dict[str, bool]
    description: str


class UserProjectAccess(BaseModel):
    """Informations d'accès d'un utilisateur à un projet"""
    can_access: bool
    effective_role: Optional[ProjectRole] = None
    access_reason: str  # "owner", "global_admin", "global_moderator", "explicit_permission", "public_project", "no_access" 