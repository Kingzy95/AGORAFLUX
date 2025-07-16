"""
Routes d'authentification pour AgoraFlux
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.dependencies import (
    get_current_user, get_current_verified_user, 
    require_admin, check_rate_limit
)
from app.services.auth_service import AuthService
from app.schemas.auth import (
    LoginRequest, TokenResponse, UserRegistration, 
    PasswordChangeRequest, RefreshTokenRequest, CurrentUser, UserProfileUpdate
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
        bio=current_user.bio,
        avatar_url=current_user.avatar_url,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )


@router.put("/me", response_model=CurrentUser)
async def update_current_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Met à jour le profil de l'utilisateur actuellement connecté
    """
    # Mettre à jour uniquement les champs fournis
    update_data = profile_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la mise à jour du profil"
        )
    
    return CurrentUser(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        bio=current_user.bio,
        avatar_url=current_user.avatar_url,
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


@router.get("/community/stats")
async def get_community_stats(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort_by: str = Query("contributions", regex="^(contributions|projects|comments|datasets|created_at|last_login)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les statistiques de la communauté avec les membres actifs
    """
    from app.models.project import Project
    from app.models.dataset import Dataset
    from app.models.comment import Comment
    
    # Récupérer tous les utilisateurs actifs
    query = db.query(User).filter(User.is_active == True)
    
    # Compter les totaux pour les statistiques générales
    total_users = query.count()
    active_users_30d = query.filter(
        User.last_login.isnot(None),
        User.last_login >= datetime.utcnow() - timedelta(days=30)
    ).count()
    
    new_users_7d = query.filter(
        User.created_at >= datetime.utcnow() - timedelta(days=7)
    ).count()
    
    # Récupérer les utilisateurs avec leurs statistiques
    users = query.all()
    
    # Calculer les statistiques pour chaque utilisateur
    user_stats = []
    for user in users:
        # Compter les projets créés
        projects_count = db.query(Project).filter(Project.owner_id == user.id).count()
        
        # Compter les datasets uploadés
        datasets_count = db.query(Dataset).filter(Dataset.uploaded_by_id == user.id).count()
        
        # Compter les commentaires
        comments_count = db.query(Comment).filter(Comment.author_id == user.id).count()
        
        # Calculer le total des contributions
        total_contributions = projects_count + datasets_count + comments_count
        
        # Calculer les jours d'activité
        days_since_creation = (datetime.utcnow() - user.created_at).days
        days_since_last_login = None
        if user.last_login:
            days_since_last_login = (datetime.utcnow() - user.last_login).days
        
        user_stats.append({
            "id": user.id,
            "name": f"{user.first_name} {user.last_name}",
            "avatar": f"{user.first_name[0]}{user.last_name[0]}",
            "role": user.role.value,
            "bio": user.bio,
            "created_at": user.created_at.isoformat(),
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "days_since_creation": days_since_creation,
            "days_since_last_login": days_since_last_login,
            "is_online": days_since_last_login is not None and days_since_last_login < 1 if days_since_last_login is not None else False,
            "stats": {
                "projects_count": projects_count,
                "datasets_count": datasets_count,
                "comments_count": comments_count,
                "total_contributions": total_contributions
            }
        })
    
    # Trier selon les critères
    if sort_by == "contributions":
        user_stats.sort(key=lambda x: x["stats"]["total_contributions"], reverse=(sort_order == "desc"))
    elif sort_by == "projects":
        user_stats.sort(key=lambda x: x["stats"]["projects_count"], reverse=(sort_order == "desc"))
    elif sort_by == "comments":
        user_stats.sort(key=lambda x: x["stats"]["comments_count"], reverse=(sort_order == "desc"))
    elif sort_by == "datasets":
        user_stats.sort(key=lambda x: x["stats"]["datasets_count"], reverse=(sort_order == "desc"))
    elif sort_by == "created_at":
        user_stats.sort(key=lambda x: x["created_at"], reverse=(sort_order == "desc"))
    elif sort_by == "last_login":
        user_stats.sort(key=lambda x: x["last_login"] or "1970-01-01", reverse=(sort_order == "desc"))
    
    # Pagination
    total = len(user_stats)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_users = user_stats[start_idx:end_idx]
    
    # Statistiques de rôles
    role_stats = {}
    for user in user_stats:
        role = user["role"]
        role_stats[role] = role_stats.get(role, 0) + 1
    
    # Top contributeurs (top 5)
    top_contributors = sorted(user_stats, key=lambda x: x["stats"]["total_contributions"], reverse=True)[:5]
    
    # Utilisateurs en ligne (dernière connexion < 24h)
    online_users = [user for user in user_stats if user["is_online"]]
    
    return {
        "community_stats": {
            "total_users": total_users,
            "active_users_30d": active_users_30d,
            "new_users_7d": new_users_7d,
            "online_users": len(online_users),
            "by_role": role_stats,
            "avg_contributions": sum(user["stats"]["total_contributions"] for user in user_stats) / len(user_stats) if user_stats else 0
        },
        "members": paginated_users,
        "top_contributors": top_contributors,
        "online_users": online_users[:10],  # Limiter à 10 pour éviter la surcharge
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }
    }


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