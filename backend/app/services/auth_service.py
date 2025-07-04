"""
Service d'authentification pour AgoraFlux
"""

from typing import Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from loguru import logger

from app.core.security import SecurityUtils, AuthenticationError, AccountLockedError
from app.core.config import settings
from app.models.user import User, UserRole
from app.schemas.auth import (
    LoginRequest, TokenResponse, UserRegistration, 
    PasswordChangeRequest, CurrentUser
)


class AuthService:
    """
    Service d'authentification et de gestion des utilisateurs
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def authenticate_user(self, login_data: LoginRequest) -> Optional[User]:
        """
        Authentifie un utilisateur avec email et mot de passe
        """
        user = self.db.query(User).filter(User.email == login_data.email).first()
        
        if not user:
            logger.warning(f"Tentative de connexion avec email inexistant: {login_data.email}")
            return None
        
        if not SecurityUtils.verify_password(login_data.password, user.password_hash):
            logger.warning(f"Tentative de connexion avec mot de passe incorrect: {login_data.email}")
            # Incrémenter le compteur de tentatives échouées
            user.failed_login_attempts += 1
            user.last_failed_login = datetime.utcnow()
            
            # Verrouiller le compte après trop de tentatives
            if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
                user.is_locked = True
                user.locked_at = datetime.utcnow()
                logger.warning(f"Compte verrouillé après {settings.MAX_LOGIN_ATTEMPTS} tentatives: {login_data.email}")
            
            self.db.commit()
            return None
        
        # Vérifier si le compte est verrouillé
        if user.is_locked:
            # Vérifier si le verrouillage a expiré
            if user.locked_at and (datetime.utcnow() - user.locked_at).total_seconds() > settings.ACCOUNT_LOCK_DURATION:
                user.is_locked = False
                user.locked_at = None
                user.failed_login_attempts = 0
                logger.info(f"Déverrouillage automatique du compte: {login_data.email}")
            else:
                logger.warning(f"Tentative de connexion sur compte verrouillé: {login_data.email}")
                raise AccountLockedError("Compte temporairement verrouillé")
        
        # Vérifier si le compte est actif
        if not user.is_active:
            logger.warning(f"Tentative de connexion sur compte inactif: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Compte désactivé"
            )
        
        # Connexion réussie - réinitialiser les compteurs
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        user.last_failed_login = None
        
        self.db.commit()
        
        logger.info(f"Connexion réussie: {login_data.email}")
        return user
    
    def create_tokens(self, user: User) -> TokenResponse:
        """
        Crée les tokens JWT pour un utilisateur
        """
        # Données à inclure dans le token
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value
        }
        
        # Créer les tokens
        access_token = SecurityUtils.create_access_token(token_data)
        refresh_token = SecurityUtils.create_refresh_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    def login(self, login_data: LoginRequest) -> TokenResponse:
        """
        Processus complet de connexion
        """
        user = self.authenticate_user(login_data)
        if not user:
            raise AuthenticationError("Email ou mot de passe incorrect")
        
        return self.create_tokens(user)
    
    def refresh_token(self, refresh_token: str) -> TokenResponse:
        """
        Rafraîchit un token d'accès
        """
        # Vérifier le token de rafraîchissement
        payload = SecurityUtils.verify_token(refresh_token, "refresh")
        if payload is None:
            raise AuthenticationError("Token de rafraîchissement invalide")
        
        # Récupérer l'utilisateur
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Token invalide")
        
        user = self.db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active or user.is_locked:
            raise AuthenticationError("Utilisateur non valide")
        
        # Créer de nouveaux tokens
        return self.create_tokens(user)
    
    def register_user(self, registration_data: UserRegistration) -> User:
        """
        Enregistre un nouvel utilisateur
        """
        # Vérifier si l'email existe déjà
        existing_user = self.db.query(User).filter(User.email == registration_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un compte avec cet email existe déjà"
            )
        
        # Valider la force du mot de passe
        if not SecurityUtils.validate_password_strength(registration_data.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le mot de passe doit contenir au moins 6 caractères avec majuscules, minuscules et chiffres"
            )
        
        # Créer l'utilisateur
        user = User(
            email=registration_data.email,
            password_hash=SecurityUtils.get_password_hash(registration_data.password),
            first_name=registration_data.first_name,
            last_name=registration_data.last_name,
            role=UserRole.USER,  # Rôle par défaut
            is_active=True,
            is_verified=False,  # Nécessite vérification email
            created_at=datetime.utcnow()
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        logger.info(f"Nouvel utilisateur enregistré: {registration_data.email}")
        return user
    
    def change_password(self, user: User, password_data: PasswordChangeRequest) -> bool:
        """
        Change le mot de passe d'un utilisateur
        """
        # Vérifier le mot de passe actuel
        if not SecurityUtils.verify_password(password_data.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mot de passe actuel incorrect"
            )
        
        # Valider la force du nouveau mot de passe
        if not SecurityUtils.validate_password_strength(password_data.new_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le nouveau mot de passe doit contenir au moins 6 caractères avec majuscules, minuscules et chiffres"
            )
        
        # Changer le mot de passe
        user.password_hash = SecurityUtils.get_password_hash(password_data.new_password)
        user.password_changed_at = datetime.utcnow()
        
        self.db.commit()
        
        logger.info(f"Mot de passe changé pour: {user.email}")
        return True
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Récupère un utilisateur par son ID
        """
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Récupère un utilisateur par son email
        """
        return self.db.query(User).filter(User.email == email).first()
    
    def update_user_role(self, user_id: int, new_role: UserRole, admin_user: User) -> User:
        """
        Met à jour le rôle d'un utilisateur (admin seulement)
        """
        if admin_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seuls les administrateurs peuvent modifier les rôles"
            )
        
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        old_role = user.role
        user.role = new_role
        self.db.commit()
        
        logger.info(f"Rôle mis à jour par {admin_user.email}: {user.email} {old_role.value} -> {new_role.value}")
        return user
    
    def deactivate_user(self, user_id: int, admin_user: User) -> User:
        """
        Désactive un utilisateur (admin seulement)
        """
        if admin_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seuls les administrateurs peuvent désactiver des comptes"
            )
        
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        user.is_active = False
        user.deactivated_at = datetime.utcnow()
        self.db.commit()
        
        logger.info(f"Utilisateur désactivé par {admin_user.email}: {user.email}")
        return user
    
    def verify_email(self, user_id: int, verification_token: str) -> bool:
        """
        Vérifie l'email d'un utilisateur
        """
        # Vérifier le token de vérification
        payload = SecurityUtils.verify_token(verification_token, "email_verification")
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de vérification invalide"
            )
        
        # Vérifier que l'ID correspond
        token_user_id = payload.get("sub")
        if not token_user_id or int(token_user_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de vérification invalide"
            )
        
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        user.is_verified = True
        user.verified_at = datetime.utcnow()
        self.db.commit()
        
        logger.info(f"Email vérifié: {user.email}")
        return True 