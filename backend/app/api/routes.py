"""
Configuration des routes principales de l'API AgoraFlux
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User

# Importer les routeurs des modules
from app.api import auth, projects, permissions, data, datasets, collaboration, notifications, exports

# Créer le routeur principal
api_router = APIRouter()

# Endpoint de santé global
@api_router.get("/health")
async def health_check():
    """
    Point de santé global de l'API
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "modules": {
            "auth": "active",
            "projects": "active",
            "datasets": "active",
            "collaboration": "active",
            "exports": "active",
            "notifications": "active",
            "data_pipeline": "active"
        }
    }

# Endpoint d'informations sur l'utilisateur connecté
@api_router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les informations de l'utilisateur connecté
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login
    }

# Inclure les sous-routeurs
api_router.include_router(auth.router, prefix="/auth", tags=["Authentification"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projets"])
api_router.include_router(permissions.router, prefix="/permissions", tags=["Permissions"])
api_router.include_router(data.router, prefix="/data", tags=["Data Pipeline"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["Datasets"])
api_router.include_router(collaboration.router, prefix="/collaboration", tags=["Collaboration"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(exports.router, prefix="/exports", tags=["Exports"])

# Endpoint pour lister tous les endpoints disponibles
@api_router.get("/endpoints")
async def list_endpoints():
    """
    Liste tous les endpoints disponibles dans l'API
    """
    return {
        "auth": [
            "POST /auth/register",
            "POST /auth/login", 
            "GET /auth/me",
            "PUT /auth/profile",
            "GET /auth/users",
            "GET /auth/community/stats"
        ],
        "projects": [
            "GET /projects",
            "POST /projects",
            "GET /projects/{project_id}",
            "PUT /projects/{project_id}",
            "DELETE /projects/{project_id}",
            "GET /projects/discussions"
        ],
        "datasets": [
            "GET /datasets",
            "POST /datasets",
            "GET /datasets/{dataset_id}",
            "PUT /datasets/{dataset_id}",
            "DELETE /datasets/{dataset_id}"
        ],
        "collaboration": [
            "GET /collaboration/comments",
            "POST /collaboration/comments",
            "PUT /collaboration/comments/{comment_id}",
            "DELETE /collaboration/comments/{comment_id}"
        ],
        "exports": [
            "GET /exports/history",
            "POST /exports",
            "GET /exports/statistics",
            "GET /exports/reports/templates",
            "POST /exports/reports/generate",
            "GET /exports/reports/history"
        ],
        "notifications": [
            "WS /notifications/ws/{user_id}",
            "GET /notifications",
            "GET /notifications/unread-count",
            "PUT /notifications/{notification_id}/read",
            "PUT /notifications/mark-all-read",
            "DELETE /notifications/{notification_id}"
        ],
        "data": [
            "GET /data/health",
            "GET /data/opendata/paris",
            "GET /data/datasets/{dataset_id}/data"
        ]
    } 