"""
Routeur principal de l'API AgoraFlux
Centralise tous les endpoints de l'application
"""

from fastapi import APIRouter
from app.core.logging import get_logger

logger = get_logger(__name__)

# Routeur principal de l'API
api_router = APIRouter()

# Import des sous-routeurs (à implémenter)
# from app.api.auth import router as auth_router
# from app.api.users import router as users_router
# from app.api.data import router as data_router
# from app.api.projects import router as projects_router
# from app.api.visualizations import router as viz_router

@api_router.get("/")
async def root():
    """
    Endpoint racine de l'API
    """
    return {
        "message": "Bienvenue sur l'API AgoraFlux",
        "description": "Plateforme de simulation et collaboration citoyenne",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": "/health"
    }

# Inclusion des sous-routeurs (à décommenter au fur et à mesure)
# api_router.include_router(auth_router, prefix="/auth", tags=["Authentification"])
# api_router.include_router(users_router, prefix="/users", tags=["Utilisateurs"])
# api_router.include_router(data_router, prefix="/data", tags=["Données"])
# api_router.include_router(projects_router, prefix="/projects", tags=["Projets"])
# api_router.include_router(viz_router, prefix="/visualizations", tags=["Visualisations"]) 