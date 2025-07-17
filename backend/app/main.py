"""
Point d'entrée principal de l'application AgoraFlux
Configuration FastAPI et middleware
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import uvicorn

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import api_router
from app.middleware.security_middleware import SecurityAuditMiddleware, RateLimitMiddleware

# Configuration du logging
setup_logging()

def create_application() -> FastAPI:
    """
    Factory pour créer l'application FastAPI
    """
    app = FastAPI(
        title="AgoraFlux API",
        description="API pour la plateforme de simulation et collaboration citoyenne",
        version="1.0.0",
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    )

    # Middleware de sécurité
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

    # Middleware d'audit de sécurité
    app.add_middleware(SecurityAuditMiddleware)
    
    # Middleware de limitation de taux
    app.add_middleware(RateLimitMiddleware, requests_per_minute=120)

    # Middleware CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["*"],
    )

    # Routes API
    app.include_router(api_router, prefix="/api/v1")

    @app.get("/health")
    async def health_check():
        """Endpoint de vérification de santé"""
        return JSONResponse(
            content={"status": "healthy", "version": "1.0.0"}
        )

    @app.on_event("startup")
    async def startup_event():
        """Événements au démarrage de l'application"""
        logger.info("🚀 AgoraFlux Backend démarre...")
        logger.info(f"Environnement: {settings.ENVIRONMENT}")

    @app.on_event("shutdown")
    async def shutdown_event():
        """Événements à l'arrêt de l'application"""
        logger.info("🛑 AgoraFlux Backend s'arrête...")

    return app

# Instance de l'application
app = create_application()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.ENVIRONMENT == "development" else False,
    ) 