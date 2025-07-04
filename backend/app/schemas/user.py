"""
Schémas Pydantic pour les utilisateurs
Validation et sérialisation des données utilisateur
"""

from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.models.user import UserRole


class UserBase(BaseModel):
    """
    Schéma de base pour les utilisateurs
    """
    email: EmailStr = Field(..., description="Email de l'utilisateur")
    first_name: str = Field(..., min_length=2, max_length=50, description="Prénom")
    last_name: str = Field(..., min_length=2, max_length=50, description="Nom")
    bio: Optional[str] = Field(None, max_length=500, description="Biographie")


class UserCreate(UserBase):
    """
    Schéma pour la création d'un utilisateur
    """
    password: str = Field(..., min_length=6, description="Mot de passe")
    role: UserRole = Field(UserRole.USER, description="Rôle de l'utilisateur")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "nouveau@agoraflux.fr",
                "password": "MotDePasse123",
                "first_name": "Jean",
                "last_name": "Dupont",
                "bio": "Citoyen engagé",
                "role": "utilisateur"
            }
        }


class UserUpdate(BaseModel):
    """
    Schéma pour la mise à jour d'un utilisateur
    """
    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = Field(None, max_length=500)
    
    class Config:
        json_schema_extra = {
            "example": {
                "first_name": "Jean",
                "last_name": "Dupont",
                "bio": "Citoyen engagé dans la démocratie participative"
            }
        }


class UserInDB(UserBase):
    """
    Schéma pour un utilisateur en base de données
    """
    id: int = Field(..., description="ID de l'utilisateur")
    role: UserRole = Field(..., description="Rôle de l'utilisateur")
    is_active: bool = Field(..., description="Statut d'activation")
    is_verified: bool = Field(..., description="Statut de vérification")
    is_locked: bool = Field(..., description="Statut de verrouillage")
    created_at: datetime = Field(..., description="Date de création")
    updated_at: Optional[datetime] = Field(None, description="Date de mise à jour")
    last_login: Optional[datetime] = Field(None, description="Dernière connexion")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "admin@agoraflux.fr",
                "first_name": "Admin",
                "last_name": "AgoraFlux",
                "bio": "Administrateur de la plateforme",
                "role": "admin",
                "is_active": True,
                "is_verified": True,
                "is_locked": False,
                "created_at": "2024-01-01T00:00:00",
                "last_login": "2024-01-01T12:00:00"
            }
        }


class UserPublic(BaseModel):
    """
    Schéma pour l'affichage public d'un utilisateur
    """
    id: int = Field(..., description="ID de l'utilisateur")
    first_name: str = Field(..., description="Prénom")
    last_name: str = Field(..., description="Nom")
    bio: Optional[str] = Field(None, description="Biographie")
    avatar_url: Optional[str] = Field(None, description="URL de l'avatar")
    role: UserRole = Field(..., description="Rôle de l'utilisateur")
    created_at: datetime = Field(..., description="Date de création")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "first_name": "Jean",
                "last_name": "Dupont",
                "bio": "Citoyen engagé",
                "role": "utilisateur",
                "created_at": "2024-01-01T00:00:00"
            }
        }


class UserList(BaseModel):
    """
    Schéma pour la liste des utilisateurs
    """
    users: list[UserInDB] = Field(..., description="Liste des utilisateurs")
    total: int = Field(..., description="Nombre total d'utilisateurs")
    page: int = Field(..., description="Page actuelle")
    per_page: int = Field(..., description="Nombre d'utilisateurs par page")
    
    class Config:
        json_schema_extra = {
            "example": {
                "users": [
                    {
                        "id": 1,
                        "email": "admin@agoraflux.fr",
                        "first_name": "Admin",
                        "last_name": "AgoraFlux",
                        "role": "admin",
                        "is_active": True,
                        "is_verified": True,
                        "is_locked": False,
                        "created_at": "2024-01-01T00:00:00"
                    }
                ],
                "total": 1,
                "page": 1,
                "per_page": 10
            }
        }


class UserRoleUpdate(BaseModel):
    """
    Schéma pour la mise à jour du rôle d'un utilisateur
    """
    role: UserRole = Field(..., description="Nouveau rôle")
    
    class Config:
        json_schema_extra = {
            "example": {
                "role": "moderateur"
            }
        }


class UserPasswordChange(BaseModel):
    """Schéma pour le changement de mot de passe"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Les mots de passe ne correspondent pas')
        return v


class UserAdmin(UserInDB):
    """Schéma complet pour les administrateurs"""
    password_changed_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """Statistiques utilisateur"""
    projects_count: int = 0
    datasets_count: int = 0
    comments_count: int = 0
    contributions_count: int = 0


class UserWithStats(UserPublic):
    """Utilisateur avec ses statistiques"""
    stats: UserStats


class UserLogin(BaseModel):
    """Schéma pour la connexion"""
    email_or_username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)
    remember_me: bool = False


class UserModerationAction(BaseModel):
    """Actions de modération sur un utilisateur"""
    user_id: int
    action: str = Field(..., pattern="^(activate|deactivate|suspend|verify|unverify)$")
    reason: Optional[str] = Field(None, max_length=500)
    duration_days: Optional[int] = Field(None, ge=1, le=365)  # Pour les suspensions 