"""
Modèle de permissions simplifiées pour AgoraFlux
Gestion des permissions par projet avec 3 rôles : admin/modérateur/utilisateur
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class ProjectRole(enum.Enum):
    """
    Rôles spécifiques aux projets (simplifié selon les exigences)
    """
    ADMIN = "admin"              # Administrateur du projet (propriétaire ou admin global)
    MODERATOR = "moderator"      # Modérateur (peut modérer commentaires et données)
    USER = "user"                # Utilisateur standard (lecture + contribution)


class ProjectPermission(Base):
    """
    Permissions d'un utilisateur sur un projet spécifique
    Système simplifié avec 3 rôles et permissions essentielles
    """
    __tablename__ = "project_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relations
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Rôle simplifié
    role = Column(Enum(ProjectRole), nullable=False)
    
    # Permissions essentielles (simplifiées)
    can_view_project = Column(Boolean, default=True)
    can_view_datasets = Column(Boolean, default=True)
    can_view_comments = Column(Boolean, default=True)
    
    can_edit_project = Column(Boolean, default=False)
    can_delete_project = Column(Boolean, default=False)
    can_upload_datasets = Column(Boolean, default=False)
    can_delete_datasets = Column(Boolean, default=False)
    
    can_create_comments = Column(Boolean, default=True)
    can_edit_comments = Column(Boolean, default=False)      # Éditer TOUS les commentaires
    can_delete_comments = Column(Boolean, default=False)    # Supprimer TOUS les commentaires
    can_moderate_comments = Column(Boolean, default=False)  # Modérer (masquer/épingler)
    
    can_manage_users = Column(Boolean, default=False)       # Inviter/retirer des utilisateurs
    can_export_data = Column(Boolean, default=False)        # Exporter les données
    
    # Métadonnées
    granted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    granted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relations
    user = relationship("User", foreign_keys=[user_id])
    project = relationship("Project")
    granted_by = relationship("User", foreign_keys=[granted_by_id])
    
    # Contrainte d'unicité : un utilisateur ne peut avoir qu'un seul rôle par projet
    __table_args__ = (
        UniqueConstraint('user_id', 'project_id', name='unique_user_project_permission'),
    )
    
    def __repr__(self):
        return f"<ProjectPermission(user_id={self.user_id}, project_id={self.project_id}, role={self.role.value})>"
    
    @classmethod
    def get_default_permissions_for_role(cls, role: ProjectRole) -> dict:
        """
        Retourne les permissions par défaut pour un rôle donné (simplifié)
        """
        if role == ProjectRole.ADMIN:
            # Admin : Tous les droits sur le projet
            return {
                'can_view_project': True,
                'can_view_datasets': True,
                'can_view_comments': True,
                'can_edit_project': True,
                'can_delete_project': True,
                'can_upload_datasets': True,
                'can_delete_datasets': True,
                'can_create_comments': True,
                'can_edit_comments': True,
                'can_delete_comments': True,
                'can_moderate_comments': True,
                'can_manage_users': True,
                'can_export_data': True,
            }
        elif role == ProjectRole.MODERATOR:
            # Modérateur : Lecture + modération + contribution
            return {
                'can_view_project': True,
                'can_view_datasets': True,
                'can_view_comments': True,
                'can_edit_project': False,
                'can_delete_project': False,
                'can_upload_datasets': True,
                'can_delete_datasets': False,
                'can_create_comments': True,
                'can_edit_comments': True,
                'can_delete_comments': True,
                'can_moderate_comments': True,
                'can_manage_users': False,
                'can_export_data': True,
            }
        else:  # ProjectRole.USER
            # Utilisateur : Lecture + contribution de base
            return {
                'can_view_project': True,
                'can_view_datasets': True,
                'can_view_comments': True,
                'can_edit_project': False,
                'can_delete_project': False,
                'can_upload_datasets': True,
                'can_delete_datasets': False,
                'can_create_comments': True,
                'can_edit_comments': False,
                'can_delete_comments': False,
                'can_moderate_comments': False,
                'can_manage_users': False,
                'can_export_data': False,
            }
    
    def apply_role_permissions(self):
        """
        Applique les permissions par défaut du rôle
        """
        default_permissions = self.get_default_permissions_for_role(self.role)
        for permission, value in default_permissions.items():
            setattr(self, permission, value)
    
    def has_permission(self, permission: str) -> bool:
        """
        Vérifie si l'utilisateur a une permission spécifique
        """
        if not self.is_active:
            return False
        
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        
        return getattr(self, f"can_{permission}", False)
    
    @property
    def is_expired(self) -> bool:
        """Vérifie si la permission a expiré"""
        if not self.expires_at:
            return False
        return self.expires_at < datetime.utcnow()
    
    @property
    def permissions_list(self) -> list:
        """Retourne la liste des permissions accordées"""
        permissions = []
        permission_attrs = [attr for attr in dir(self) if attr.startswith('can_')]
        
        for attr in permission_attrs:
            if getattr(self, attr, False):
                permission_name = attr.replace('can_', '')
                permissions.append(permission_name)
        
        return permissions 