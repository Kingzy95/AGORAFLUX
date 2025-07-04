"""
Routes principales de l'API AgoraFlux
Agrège tous les routeurs des différents modules
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

# Créer le routeur principal
api_router = APIRouter()

@api_router.get("/")
async def api_root():
    """
    Point d'entrée de l'API
    """
    return JSONResponse(
        content={
            "message": "Bienvenue sur l'API AgoraFlux",
            "version": "1.0.0",
            "description": "Plateforme de simulation et collaboration citoyenne",
            "docs": "/docs",
            "health": "/health"
        }
    )

@api_router.get("/status")
async def api_status():
    """
    Statut de l'API
    """
    return JSONResponse(
        content={
            "status": "operational",
            "services": {
                "database": "connected",
                "api": "running"
            }
        }
    )

# Import des routeurs des modules spécifiques
from app.api.auth import router as auth_router

# Inclusion des routeurs
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])

# TODO: Ajouter les autres routeurs
# from app.api.users import users_router
# from app.api.projects import projects_router
# from app.api.datasets import datasets_router
# from app.api.comments import comments_router

# api_router.include_router(users_router, prefix="/users", tags=["users"])
# api_router.include_router(projects_router, prefix="/projects", tags=["projects"])
# api_router.include_router(datasets_router, prefix="/datasets", tags=["datasets"])
# api_router.include_router(comments_router, prefix="/comments", tags=["comments"]) 