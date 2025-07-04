"""
Module de sécurité pour AgoraFlux
Gestion JWT, hachage des mots de passe et authentification
"""

from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from pydantic import ValidationError

from app.core.config import settings
from app.models.user import UserRole


# Configuration du hachage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SecurityUtils:
    """
    Utilitaires de sécurité pour l'authentification et l'autorisation
    """
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Vérifie un mot de passe en clair contre son hash
        """
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """
        Hash un mot de passe en clair
        """
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(
        data: dict, 
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Crée un token JWT d'accès
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.SECRET_KEY, 
            algorithm=settings.ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(
        data: dict, 
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Crée un token JWT de rafraîchissement
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                days=settings.REFRESH_TOKEN_EXPIRE_DAYS
            )
        
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.SECRET_KEY, 
            algorithm=settings.ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
        """
        Vérifie et décode un token JWT
        """
        try:
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=[settings.ALGORITHM]
            )
            
            # Vérifier le type de token
            if payload.get("type") != token_type:
                return None
                
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def validate_password_strength(password: str) -> bool:
        """
        Valide la force d'un mot de passe
        """
        if len(password) < settings.PASSWORD_MIN_LENGTH:
            return False
        
        # Vérifications basiques de sécurité
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        
        return has_upper and has_lower and has_digit


class PermissionChecker:
    """
    Vérificateur de permissions basé sur les rôles
    """
    
    @staticmethod
    def can_moderate(user_role: UserRole) -> bool:
        """
        Vérifie si l'utilisateur peut modérer
        """
        return user_role in [UserRole.ADMIN, UserRole.MODERATOR]
    
    @staticmethod
    def can_admin(user_role: UserRole) -> bool:
        """
        Vérifie si l'utilisateur a les droits d'administration
        """
        return user_role == UserRole.ADMIN
    
    @staticmethod
    def can_access_project(user_role: UserRole, project_visibility: str, is_owner: bool = False) -> bool:
        """
        Vérifie si l'utilisateur peut accéder à un projet
        """
        if project_visibility == "public":
            return True
        elif project_visibility == "private":
            return is_owner or user_role == UserRole.ADMIN
        elif project_visibility == "restricted":
            return is_owner or PermissionChecker.can_moderate(user_role)
        return False
    
    @staticmethod
    def can_edit_project(user_role: UserRole, is_owner: bool = False) -> bool:
        """
        Vérifie si l'utilisateur peut éditer un projet
        """
        return is_owner or user_role == UserRole.ADMIN
    
    @staticmethod
    def can_delete_project(user_role: UserRole, is_owner: bool = False) -> bool:
        """
        Vérifie si l'utilisateur peut supprimer un projet
        """
        return is_owner or user_role == UserRole.ADMIN
    
    @staticmethod
    def can_moderate_comment(user_role: UserRole, is_author: bool = False) -> bool:
        """
        Vérifie si l'utilisateur peut modérer un commentaire
        """
        return is_author or PermissionChecker.can_moderate(user_role)


# Exceptions personnalisées
class AuthenticationError(HTTPException):
    """Exception pour les erreurs d'authentification"""
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class PermissionError(HTTPException):
    """Exception pour les erreurs de permissions"""
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


class AccountLockedError(HTTPException):
    """Exception pour les comptes verrouillés"""
    def __init__(self, detail: str = "Account is locked"):
        super().__init__(
            status_code=status.HTTP_423_LOCKED,
            detail=detail,
        ) 