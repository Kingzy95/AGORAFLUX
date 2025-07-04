"""
Dépendances FastAPI pour l'authentification et l'autorisation
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.security import SecurityUtils, AuthenticationError, AccountLockedError
from app.models.user import User, UserRole
from app.schemas.auth import CurrentUser, TokenPayload


# Configuration du schéma de sécurité Bearer
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dépendance pour obtenir l'utilisateur actuellement connecté
    """
    token = credentials.credentials
    
    # Vérifier et décoder le token
    payload = SecurityUtils.verify_token(token, "access")
    if payload is None:
        raise AuthenticationError("Token invalide ou expiré")
    
    # Extraire l'ID utilisateur du payload
    user_id = payload.get("sub")
    if user_id is None:
        raise AuthenticationError("Token invalide")
    
    # Récupérer l'utilisateur en base
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise AuthenticationError("Utilisateur non trouvé")
    
    # Vérifier que l'utilisateur est actif
    if not user.is_active:
        raise AccountLockedError("Compte désactivé")
    
    # Vérifier que l'utilisateur n'est pas verrouillé
    if user.is_locked:
        raise AccountLockedError("Compte verrouillé")
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dépendance pour obtenir l'utilisateur actif actuellement connecté
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilisateur inactif"
        )
    return current_user


def get_current_verified_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dépendance pour obtenir l'utilisateur vérifié actuellement connecté
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email non vérifié"
        )
    return current_user


def require_role(required_role: UserRole):
    """
    Générateur de dépendance pour vérifier les rôles
    """
    def role_checker(current_user: User = Depends(get_current_verified_user)) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Rôle {required_role.value} requis"
            )
        return current_user
    return role_checker


def require_admin(current_user: User = Depends(get_current_verified_user)) -> User:
    """
    Dépendance pour vérifier les droits d'administration
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Droits d'administration requis"
        )
    return current_user


def require_moderator_or_admin(current_user: User = Depends(get_current_verified_user)) -> User:
    """
    Dépendance pour vérifier les droits de modération ou d'administration
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Droits de modération ou d'administration requis"
        )
    return current_user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dépendance pour obtenir l'utilisateur optionnel (peut être None)
    Utile pour les endpoints qui peuvent fonctionner avec ou sans authentification
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = SecurityUtils.verify_token(token, "access")
        if payload is None:
            return None
        
        user_id = payload.get("sub")
        if user_id is None:
            return None
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None or not user.is_active or user.is_locked:
            return None
        
        return user
    except Exception:
        return None


class RateLimiter:
    """
    Limiteur de taux pour les tentatives de connexion
    """
    def __init__(self, max_attempts: int = 5, window_minutes: int = 15):
        self.max_attempts = max_attempts
        self.window_minutes = window_minutes
        self.attempts = {}
    
    def is_allowed(self, identifier: str) -> bool:
        """
        Vérifie si l'identifiant peut encore tenter une connexion
        """
        now = datetime.utcnow()
        
        if identifier not in self.attempts:
            self.attempts[identifier] = []
        
        # Nettoyer les tentatives anciennes
        self.attempts[identifier] = [
            attempt for attempt in self.attempts[identifier]
            if (now - attempt).total_seconds() < self.window_minutes * 60
        ]
        
        return len(self.attempts[identifier]) < self.max_attempts
    
    def record_attempt(self, identifier: str):
        """
        Enregistre une tentative de connexion
        """
        if identifier not in self.attempts:
            self.attempts[identifier] = []
        
        self.attempts[identifier].append(datetime.utcnow())


# Instance globale du limiteur de taux
rate_limiter = RateLimiter()


def check_rate_limit(identifier: str):
    """
    Vérifie et enregistre une tentative de connexion
    """
    if not rate_limiter.is_allowed(identifier):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Trop de tentatives de connexion. Réessayez plus tard."
        )
    
    rate_limiter.record_attempt(identifier) 