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
from app.api.data import router as data_router
from app.api.collaboration import router as collaboration_router
from app.api.exports import router as exports_router
from app.api.projects import router as projects_router
from app.api.datasets import router as datasets_router

# Inclusion des routeurs
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(projects_router, tags=["projects"])
api_router.include_router(datasets_router, tags=["datasets"])
api_router.include_router(data_router, tags=["pipeline"])
api_router.include_router(collaboration_router, tags=["collaboration"])
api_router.include_router(exports_router, tags=["exports"])

# TODO: Ajouter les autres routeurs
# from app.api.users import users_router
# from app.api.projects import projects_router
# from app.api.datasets import datasets_router
# from app.api.comments import comments_router

# api_router.include_router(users_router, prefix="/users", tags=["users"])
# api_router.include_router(projects_router, prefix="/projects", tags=["projects"])
# api_router.include_router(datasets_router, prefix="/datasets", tags=["datasets"])
# api_router.include_router(comments_router, prefix="/comments", tags=["comments"]) 