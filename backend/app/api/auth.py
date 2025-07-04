"""
Routes d'authentification pour AgoraFlux
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.dependencies import (
    get_current_user, get_current_verified_user, 
    require_admin, check_rate_limit
)
from app.services.auth_service import AuthService
from app.schemas.auth import (
    LoginRequest, TokenResponse, UserRegistration, 
    PasswordChangeRequest, RefreshTokenRequest, CurrentUser
)
from app.models.user import User, UserRole


router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Connexion utilisateur avec email et mot de passe
    """
    # Vérifier la limite de taux basée sur l'IP
    client_ip = request.client.host
    check_rate_limit(client_ip)
    
    # Vérifier la limite de taux basée sur l'email
    check_rate_limit(login_data.email)
    
    auth_service = AuthService(db)
    return auth_service.login(login_data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Rafraîchissement du token d'accès
    """
    auth_service = AuthService(db)
    return auth_service.refresh_token(refresh_data.refresh_token)


@router.post("/register", response_model=CurrentUser)
async def register(
    registration_data: UserRegistration,
    db: Session = Depends(get_db)
):
    """
    Enregistrement d'un nouvel utilisateur
    """
    auth_service = AuthService(db)
    user = auth_service.register_user(registration_data)
    
    # Retourner les informations de l'utilisateur créé
    return CurrentUser(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        last_login=user.last_login
    )


@router.get("/me", response_model=CurrentUser)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Récupère les informations de l'utilisateur actuellement connecté
    """
    return CurrentUser(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )


@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """
    Changement de mot de passe pour l'utilisateur connecté
    """
    auth_service = AuthService(db)
    auth_service.change_password(current_user, password_data)
    
    return {"message": "Mot de passe changé avec succès"}


@router.post("/verify-email/{user_id}")
async def verify_email(
    user_id: int,
    verification_token: str,
    db: Session = Depends(get_db)
):
    """
    Vérification de l'email d'un utilisateur
    """
    auth_service = AuthService(db)
    auth_service.verify_email(user_id, verification_token)
    
    return {"message": "Email vérifié avec succès"}


# Routes d'administration
@router.get("/users", response_model=List[CurrentUser])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Liste tous les utilisateurs (admin seulement)
    """
    users = db.query(User).offset(skip).limit(limit).all()
    
    return [
        CurrentUser(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login=user.last_login
        )
        for user in users
    ]


@router.get("/users/{user_id}", response_model=CurrentUser)
async def get_user(
    user_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Récupère un utilisateur par son ID (admin seulement)
    """
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    return CurrentUser(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        last_login=user.last_login
    )


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    new_role: UserRole,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Met à jour le rôle d'un utilisateur (admin seulement)
    """
    auth_service = AuthService(db)
    user = auth_service.update_user_role(user_id, new_role, admin_user)
    
    return {
        "message": f"Rôle mis à jour vers {new_role.value}",
        "user": CurrentUser(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login=user.last_login
        )
    }


@router.put("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Désactive un utilisateur (admin seulement)
    """
    auth_service = AuthService(db)
    user = auth_service.deactivate_user(user_id, admin_user)
    
    return {
        "message": "Utilisateur désactivé",
        "user": CurrentUser(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login=user.last_login
        )
    }


@router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Réactive un utilisateur (admin seulement)
    """
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    user.is_active = True
    user.deactivated_at = None
    db.commit()
    
    return {
        "message": "Utilisateur réactivé",
        "user": CurrentUser(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login=user.last_login
        )
    }


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Déconnexion utilisateur
    Note: Avec JWT, la déconnexion côté serveur nécessiterait une blacklist des tokens
    Pour l'instant, on se contente de confirmer la déconnexion
    """
    return {"message": "Déconnexion réussie"}


@router.get("/status")
async def auth_status():
    """
    Statut du système d'authentification
    """
    return {
        "status": "operational",
        "features": {
            "jwt_authentication": True,
            "role_based_access": True,
            "rate_limiting": True,
            "account_locking": True,
            "email_verification": True
        }
    } 