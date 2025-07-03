"""
Schémas Pydantic pour les utilisateurs
Validation et sérialisation des données utilisateur
"""

from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.models.user import UserRole, UserStatus


class UserBase(BaseModel):
    """Schéma de base pour les utilisateurs"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")
    full_name: str = Field(..., min_length=2, max_length=255)
    bio: Optional[str] = Field(None, max_length=1000)
    location: Optional[str] = Field(None, max_length=255)
    website: Optional[str] = Field(None, max_length=255)

    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, _ et -')
        return v

    @validator('website')
    def validate_website(cls, v):
        if v and not (v.startswith('http://') or v.startswith('https://')):
            raise ValueError('L\'URL du site web doit commencer par http:// ou https://')
        return v


class UserCreate(UserBase):
    """Schéma pour la création d'un utilisateur"""
    password: str = Field(..., min_length=8, max_length=128)
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Le mot de passe doit contenir au moins 8 caractères')
        if not any(c.isupper() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une majuscule')
        if not any(c.islower() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une minuscule')
        if not any(c.isdigit() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre')
        return v


class UserUpdate(BaseModel):
    """Schéma pour la mise à jour d'un utilisateur"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    bio: Optional[str] = Field(None, max_length=1000)
    location: Optional[str] = Field(None, max_length=255)
    website: Optional[str] = Field(None, max_length=255)

    @validator('username')
    def username_alphanumeric(cls, v):
        if v and not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, _ et -')
        return v


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


class UserInDB(UserBase):
    """Schéma pour les utilisateurs en base de données"""
    id: int
    role: UserRole
    status: UserStatus
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime]
    last_login: Optional[datetime]
    failed_login_attempts: int
    locked_until: Optional[datetime]

    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    """Schéma public pour les utilisateurs (sans informations sensibles)"""
    id: int
    username: str
    full_name: str
    bio: Optional[str]
    location: Optional[str]
    website: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


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


class UserList(BaseModel):
    """Liste paginée d'utilisateurs"""
    users: List[UserPublic]
    total: int
    page: int
    per_page: int
    pages: int


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