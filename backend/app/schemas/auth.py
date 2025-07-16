"""
Schémas Pydantic pour l'authentification
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime

from app.models.user import UserRole


class LoginRequest(BaseModel):
    """
    Schéma pour la requête de connexion
    """
    email: EmailStr = Field(..., description="Email de l'utilisateur")
    password: str = Field(..., min_length=6, description="Mot de passe")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@agoraflux.fr",
                "password": "admin123"
            }
        }


class TokenResponse(BaseModel):
    """
    Schéma pour la réponse de token
    """
    access_token: str = Field(..., description="Token d'accès JWT")
    refresh_token: str = Field(..., description="Token de rafraîchissement JWT")
    token_type: str = Field(default="bearer", description="Type de token")
    expires_in: int = Field(..., description="Durée de vie du token en secondes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 3600
            }
        }


class RefreshTokenRequest(BaseModel):
    """
    Schéma pour la requête de rafraîchissement de token
    """
    refresh_token: str = Field(..., description="Token de rafraîchissement")
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }


class UserRegistration(BaseModel):
    """
    Schéma pour l'enregistrement d'un nouvel utilisateur
    """
    email: EmailStr = Field(..., description="Email de l'utilisateur")
    password: str = Field(..., min_length=6, description="Mot de passe")
    password_confirm: str = Field(..., min_length=6, description="Confirmation du mot de passe")
    first_name: str = Field(..., min_length=2, max_length=50, description="Prénom")
    last_name: str = Field(..., min_length=2, max_length=50, description="Nom")
    
    @validator('password_confirm')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Les mots de passe ne correspondent pas')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "nouveau@agoraflux.fr",
                "password": "MotDePasse123",
                "password_confirm": "MotDePasse123",
                "first_name": "Jean",
                "last_name": "Dupont"
            }
        }


class PasswordChangeRequest(BaseModel):
    """
    Schéma pour le changement de mot de passe
    """
    current_password: str = Field(..., description="Mot de passe actuel")
    new_password: str = Field(..., min_length=6, description="Nouveau mot de passe")
    new_password_confirm: str = Field(..., min_length=6, description="Confirmation du nouveau mot de passe")
    
    @validator('new_password_confirm')
    def passwords_match(cls, v, values, **kwargs):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Les nouveaux mots de passe ne correspondent pas')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "current_password": "AncienMotDePasse123",
                "new_password": "NouveauMotDePasse123",
                "new_password_confirm": "NouveauMotDePasse123"
            }
        }


class PasswordResetRequest(BaseModel):
    """
    Schéma pour la demande de réinitialisation de mot de passe
    """
    email: EmailStr = Field(..., description="Email de l'utilisateur")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "utilisateur@agoraflux.fr"
            }
        }


class PasswordResetConfirm(BaseModel):
    """
    Schéma pour la confirmation de réinitialisation de mot de passe
    """
    token: str = Field(..., description="Token de réinitialisation")
    new_password: str = Field(..., min_length=6, description="Nouveau mot de passe")
    new_password_confirm: str = Field(..., min_length=6, description="Confirmation du nouveau mot de passe")
    
    @validator('new_password_confirm')
    def passwords_match(cls, v, values, **kwargs):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Les nouveaux mots de passe ne correspondent pas')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "token": "reset_token_here",
                "new_password": "NouveauMotDePasse123",
                "new_password_confirm": "NouveauMotDePasse123"
            }
        }


class CurrentUser(BaseModel):
    """
    Schéma pour l'utilisateur actuellement connecté
    """
    id: int = Field(..., description="ID de l'utilisateur")
    email: EmailStr = Field(..., description="Email de l'utilisateur")
    first_name: str = Field(..., description="Prénom")
    last_name: str = Field(..., description="Nom")
    bio: Optional[str] = Field(None, description="Biographie")
    avatar_url: Optional[str] = Field(None, description="URL de l'avatar")
    role: UserRole = Field(..., description="Rôle de l'utilisateur")
    is_active: bool = Field(..., description="Statut d'activation")
    is_verified: bool = Field(..., description="Statut de vérification")
    created_at: datetime = Field(..., description="Date de création")
    last_login: Optional[datetime] = Field(None, description="Dernière connexion")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "admin@agoraflux.fr",
                "first_name": "Admin",
                "last_name": "AgoraFlux",
                "bio": "Administrateur de la plateforme AgoraFlux",
                "avatar_url": None,
                "role": "admin",
                "is_active": True,
                "is_verified": True,
                "created_at": "2024-01-01T00:00:00",
                "last_login": "2024-01-01T12:00:00"
            }
        }


class UserProfileUpdate(BaseModel):
    """
    Schéma pour la mise à jour du profil utilisateur
    """
    first_name: Optional[str] = Field(None, min_length=2, max_length=50, description="Prénom")
    last_name: Optional[str] = Field(None, min_length=2, max_length=50, description="Nom")
    bio: Optional[str] = Field(None, max_length=500, description="Biographie")
    avatar_url: Optional[str] = Field(None, max_length=500, description="URL de l'avatar")
    
    class Config:
        json_schema_extra = {
            "example": {
                "first_name": "Jean",
                "last_name": "Dupont",
                "bio": "Citoyen engagé pour la transparence des données publiques",
                "avatar_url": "https://example.com/avatar.jpg"
            }
        }


class TokenPayload(BaseModel):
    """
    Schéma pour le payload du token JWT
    """
    sub: str = Field(..., description="Subject (user ID)")
    email: str = Field(..., description="Email de l'utilisateur")
    role: str = Field(..., description="Rôle de l'utilisateur")
    exp: int = Field(..., description="Date d'expiration")
    type: str = Field(..., description="Type de token")
    
    class Config:
        json_schema_extra = {
            "example": {
                "sub": "1",
                "email": "admin@agoraflux.fr",
                "role": "admin",
                "exp": 1640995200,
                "type": "access"
            }
        } 