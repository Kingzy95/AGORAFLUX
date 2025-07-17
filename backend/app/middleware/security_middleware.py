"""
Middleware de sécurité pour l'audit automatique des routes sensibles
"""

from fastapi import Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from typing import Callable
import time
import re
from datetime import datetime

from app.core.security_logging import SecurityLogger, SecurityEventType
from app.core.database import SessionLocal
from app.core.security import SecurityUtils


class SecurityAuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware pour l'audit automatique des accès sensibles
    """
    
    def __init__(self, app, sensitive_routes: list = None):
        super().__init__(app)
        
        # Routes sensibles à auditer (patterns regex)
        self.sensitive_routes = sensitive_routes or [
            r"/api/v1/auth/.*",                    # Authentification
            r"/api/v1/admin/.*",                   # Administration
            r"/api/v1/permissions/.*",             # Gestion permissions
            r"/api/v1/projects/.*/permissions/.*", # Permissions projets
            r"/api/v1/projects/.*/delete",         # Suppression projets
            r"/api/v1/users/.*/role",              # Changement rôles
            r"/api/v1/exports/.*",                 # Exports de données
            r"/api/v1/moderation/.*",              # Modération
        ]
        
        # Actions qui nécessitent un audit
        self.audit_methods = {"POST", "PUT", "DELETE", "PATCH"}
        
        # Compteurs de tentatives par IP
        self.failed_attempts = {}
        self.suspicious_ips = set()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Traite chaque requête pour l'audit de sécurité
        """
        start_time = time.time()
        
        # Vérifier si c'est une route sensible
        is_sensitive = self._is_sensitive_route(request.url.path)
        needs_audit = is_sensitive or request.method in self.audit_methods
        
        # Variables pour l'audit
        user_info = None
        error_occurred = False
        status_code = 200
        
        try:
            # Extraire les informations utilisateur si token présent
            user_info = await self._extract_user_info(request)
            
            # Vérifier les tentatives suspectes
            if await self._check_suspicious_activity(request, user_info):
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Trop de tentatives. Accès temporairement bloqué."}
                )
            
            # Traiter la requête
            response = await call_next(request)
            status_code = response.status_code
            
            # Vérifier si c'est un échec
            error_occurred = status_code >= 400
            
        except Exception as e:
            error_occurred = True
            status_code = 500
            
            # Log de l'erreur
            if needs_audit:
                await self._log_security_event(
                    request=request,
                    user_info=user_info,
                    event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
                    success=False,
                    error_message=f"Exception during request: {str(e)}"
                )
            
            # Re-lancer l'exception
            raise e
        
        # Audit des routes sensibles
        if needs_audit:
            await self._audit_request(
                request=request,
                response=response,
                user_info=user_info,
                is_sensitive=is_sensitive,
                error_occurred=error_occurred
            )
        
        # Mesurer le temps de réponse (pour détecter les attaques)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
    
    def _is_sensitive_route(self, path: str) -> bool:
        """Vérifie si une route est sensible"""
        for pattern in self.sensitive_routes:
            if re.match(pattern, path):
                return True
        return False
    
    async def _extract_user_info(self, request: Request) -> dict:
        """Extrait les informations utilisateur du token JWT"""
        try:
            auth_header = request.headers.get("authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return None
            
            token = auth_header.split(" ")[1]
            payload = SecurityUtils.verify_token(token, "access")
            
            if payload:
                return {
                    "user_id": payload.get("sub"),
                    "email": payload.get("email"),
                    "role": payload.get("role")
                }
        except Exception:
            pass
        
        return None
    
    async def _check_suspicious_activity(self, request: Request, user_info: dict) -> bool:
        """Vérifie s'il y a une activité suspecte"""
        client_ip = self._get_client_ip(request)
        
        # Vérifier si l'IP est déjà marquée comme suspecte
        if client_ip in self.suspicious_ips:
            return True
        
        # Vérifier les tentatives échouées récentes pour cette IP
        current_failures = self.failed_attempts.get(client_ip, 0)
        if current_failures >= 10:  # Seuil de 10 échecs
            self.suspicious_ips.add(client_ip)
            await self._log_security_event(
                request=request,
                user_info=user_info,
                event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
                success=False,
                error_message=f"IP {client_ip} marked as suspicious after {current_failures} failures"
            )
            return True
        
        return False
    
    async def _audit_request(
        self,
        request: Request,
        response: Response,
        user_info: dict,
        is_sensitive: bool,
        error_occurred: bool
    ):
        """Audite une requête"""
        
        # Déterminer le type d'événement
        event_type = self._determine_event_type(request, is_sensitive, error_occurred)
        
        if not event_type:
            return
        
        # Extraire les détails de la ressource
        resource_info = self._extract_resource_info(request)
        
        # Logger l'événement
        await self._log_security_event(
            request=request,
            user_info=user_info,
            event_type=event_type,
            success=not error_occurred,
            resource_type=resource_info.get("type"),
            resource_id=resource_info.get("id"),
            action=resource_info.get("action"),
            error_message=f"HTTP {response.status_code}" if error_occurred else None
        )
        
        # Mettre à jour les compteurs d'échecs
        if error_occurred and response.status_code in [401, 403]:
            client_ip = self._get_client_ip(request)
            self.failed_attempts[client_ip] = self.failed_attempts.get(client_ip, 0) + 1
    
    def _determine_event_type(self, request: Request, is_sensitive: bool, error_occurred: bool) -> SecurityEventType:
        """Détermine le type d'événement de sécurité"""
        path = request.url.path.lower()
        method = request.method
        
        # Routes d'authentification
        if "/auth/login" in path:
            return SecurityEventType.LOGIN_FAILED if error_occurred else SecurityEventType.LOGIN_SUCCESS
        elif "/auth/logout" in path:
            return SecurityEventType.LOGOUT
        elif "/auth/change-password" in path:
            return SecurityEventType.PASSWORD_CHANGE
        
        # Routes d'administration
        elif "/admin/" in path:
            return SecurityEventType.ADMIN_ACCESS
        
        # Routes de modération
        elif "/moderation/" in path or "/moderate" in path:
            return SecurityEventType.MODERATOR_ACCESS
        
        # Permissions
        elif "/permissions/" in path:
            if method == "POST":
                return SecurityEventType.PERMISSION_GRANTED
            elif method == "DELETE":
                return SecurityEventType.PERMISSION_REVOKED
            else:
                return SecurityEventType.ADMIN_ACCESS
        
        # Accès refusé
        elif error_occurred and is_sensitive:
            return SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT
        
        # Exports
        elif "/export" in path:
            return SecurityEventType.DATA_EXPORTED
        
        # Actions sensibles sur les projets
        elif "/projects/" in path and method == "DELETE":
            return SecurityEventType.PROJECT_DELETED
        elif "/projects/" in path and method == "POST":
            return SecurityEventType.PROJECT_CREATED
        
        return None
    
    def _extract_resource_info(self, request: Request) -> dict:
        """Extrait les informations sur la ressource"""
        path = request.url.path
        method = request.method
        
        # Pattern pour extraire les IDs des projets
        project_match = re.search(r"/projects/(\d+)", path)
        user_match = re.search(r"/users/(\d+)", path)
        
        resource_info = {
            "type": None,
            "id": None,
            "action": method.lower()
        }
        
        if project_match:
            resource_info["type"] = "project"
            resource_info["id"] = int(project_match.group(1))
        elif user_match:
            resource_info["type"] = "user"
            resource_info["id"] = int(user_match.group(1))
        elif "/permissions/" in path:
            resource_info["type"] = "permission"
        elif "/admin/" in path:
            resource_info["type"] = "admin"
        elif "/moderation/" in path:
            resource_info["type"] = "moderation"
        
        return resource_info
    
    async def _log_security_event(
        self,
        request: Request,
        user_info: dict,
        event_type: SecurityEventType,
        success: bool = True,
        resource_type: str = None,
        resource_id: int = None,
        action: str = None,
        error_message: str = None
    ):
        """Log un événement de sécurité"""
        try:
            db = SessionLocal()
            security_logger = SecurityLogger(db)
            
            # Préparer les informations utilisateur
            user_id = None
            user_email = None
            user_role = None
            
            if user_info:
                user_id = user_info.get("user_id")
                user_email = user_info.get("email")
                user_role = user_info.get("role")
            
            # Données additionnelles
            additional_data = {
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params) if request.query_params else None,
                "content_type": request.headers.get("content-type"),
                "user_agent": request.headers.get("user-agent"),
                "referer": request.headers.get("referer")
            }
            
            # Logger l'événement
            security_logger.log_event(
                event_type=event_type,
                user_id=int(user_id) if user_id else None,
                user_email=user_email,
                user_role=user_role,
                ip_address=self._get_client_ip(request),
                user_agent=request.headers.get("user-agent"),
                resource_type=resource_type,
                resource_id=resource_id,
                action=action,
                success=success,
                error_message=error_message,
                additional_data=additional_data,
                request=request
            )
            
            db.close()
            
        except Exception as e:
            # Log l'erreur mais ne pas faire échouer la requête
            print(f"Erreur lors du logging de sécurité: {e}")
    
    def _get_client_ip(self, request: Request) -> str:
        """Extrait l'adresse IP du client"""
        # Vérifier les headers de proxy
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # IP directe
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware pour la limitation du taux de requêtes
    """
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = {}  # IP -> [timestamps]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = self._get_client_ip(request)
        now = time.time()
        
        # Nettoyer les anciennes requêtes
        self._cleanup_old_requests(now)
        
        # Vérifier la limite
        if client_ip in self.requests:
            if len(self.requests[client_ip]) >= self.requests_per_minute:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Trop de requêtes. Veuillez patienter."}
                )
        
        # Ajouter la requête actuelle
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        self.requests[client_ip].append(now)
        
        response = await call_next(request)
        return response
    
    def _cleanup_old_requests(self, now: float):
        """Nettoie les requêtes anciennes (plus d'1 minute)"""
        minute_ago = now - 60
        
        for ip in list(self.requests.keys()):
            self.requests[ip] = [req_time for req_time in self.requests[ip] if req_time > minute_ago]
            
            # Supprimer les IPs sans requêtes récentes
            if not self.requests[ip]:
                del self.requests[ip]
    
    def _get_client_ip(self, request: Request) -> str:
        """Extrait l'adresse IP du client"""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return "unknown" 