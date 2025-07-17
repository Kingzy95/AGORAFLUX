"""
Tests pour le système de sécurité
Middleware, journalisation, permissions
"""

import pytest
from unittest.mock import Mock, patch
from fastapi import Request
from fastapi import status

from app.middleware.security_middleware import SecurityAuditMiddleware, RateLimitMiddleware
from app.core.security_logging import SecurityLogger, SecurityEventType, SecurityLog
from app.core.security import PermissionChecker
from app.models.user import UserRole


class TestSecurityLogging:
    """Tests du système de journalisation de sécurité"""
    
    def test_log_login_success(self, db_session):
        """Test de journalisation d'une connexion réussie"""
        logger = SecurityLogger(db_session)
        
        log_entry = logger.log_event(
            event_type=SecurityEventType.LOGIN_SUCCESS,
            user_id=1,
            user_email="test@example.com",
            user_role="user",
            ip_address="192.168.1.1",
            action="login",
            success=True
        )
        
        assert log_entry.id is not None
        assert log_entry.event_type == SecurityEventType.LOGIN_SUCCESS
        assert log_entry.user_email == "test@example.com"
        assert log_entry.ip_address == "192.168.1.1"
        assert log_entry.success is True
    
    def test_log_failed_login(self, db_session):
        """Test de journalisation d'une connexion échouée"""
        logger = SecurityLogger(db_session)
        
        log_entry = logger.log_event(
            event_type=SecurityEventType.LOGIN_FAILED,
            user_email="hacker@example.com",
            ip_address="10.0.0.1",
            action="login",
            success=False,
            error_message="Invalid credentials"
        )
        
        assert log_entry.event_type == SecurityEventType.LOGIN_FAILED
        assert log_entry.success is False
        assert log_entry.error_message == "Invalid credentials"
    
    def test_log_admin_access(self, db_session):
        """Test de journalisation d'un accès administrateur"""
        logger = SecurityLogger(db_session)
        
        log_entry = logger.log_event(
            event_type=SecurityEventType.ADMIN_ACCESS,
            user_id=1,
            user_email="admin@example.com",
            user_role="admin",
            ip_address="192.168.1.100",
            resource_type="user",
            resource_id=5,
            action="delete",
            success=True
        )
        
        assert log_entry.event_type == SecurityEventType.ADMIN_ACCESS
        assert log_entry.resource_type == "user"
        assert log_entry.resource_id == 5
        assert log_entry.action == "delete"
    
    def test_log_suspicious_activity(self, db_session):
        """Test de journalisation d'activité suspecte"""
        logger = SecurityLogger(db_session)
        
        log_entry = logger.log_event(
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            ip_address="1.2.3.4",
            action="multiple_failed_attempts",
            success=False,
            error_message="10 failed login attempts in 5 minutes",
            additional_data={"attempts": 10, "timeframe": "5min"}
        )
        
        assert log_entry.event_type == SecurityEventType.SUSPICIOUS_ACTIVITY
        assert "10 failed login attempts" in log_entry.error_message
        assert '"attempts": 10' in log_entry.additional_data
    
    def test_log_data_export(self, db_session):
        """Test de journalisation d'export de données"""
        logger = SecurityLogger(db_session)
        
        log_entry = logger.log_event(
            event_type=SecurityEventType.DATA_EXPORTED,
            user_id=2,
            user_email="user@example.com",
            ip_address="192.168.1.50",
            resource_type="project",
            resource_id=10,
            action="export_csv",
            success=True,
            additional_data={"format": "csv", "rows": 1500}
        )
        
        assert log_entry.event_type == SecurityEventType.DATA_EXPORTED
        assert log_entry.resource_type == "project"
        assert '"format": "csv"' in log_entry.additional_data


class TestPermissionChecker:
    """Tests du vérificateur de permissions"""
    
    def test_can_moderate_permissions(self):
        """Test des permissions de modération"""
        # Admin peut modérer
        assert PermissionChecker.can_moderate(UserRole.ADMIN)
        
        # Modérateur peut modérer
        assert PermissionChecker.can_moderate(UserRole.MODERATOR)
        
        # Utilisateur normal ne peut pas modérer
        assert not PermissionChecker.can_moderate(UserRole.USER)
    
    def test_can_admin_permissions(self):
        """Test des permissions d'administration"""
        # Seul l'admin a les droits d'administration
        assert PermissionChecker.can_admin(UserRole.ADMIN)
        assert not PermissionChecker.can_admin(UserRole.MODERATOR)
        assert not PermissionChecker.can_admin(UserRole.USER)
    
    def test_can_access_project_public(self):
        """Test d'accès aux projets publics"""
        # Tout le monde peut accéder aux projets publics
        assert PermissionChecker.can_access_project(UserRole.USER, "public", False)
        assert PermissionChecker.can_access_project(UserRole.MODERATOR, "public", False)
        assert PermissionChecker.can_access_project(UserRole.ADMIN, "public", False)
    
    def test_can_access_project_private(self):
        """Test d'accès aux projets privés"""
        # Seuls le propriétaire et l'admin peuvent accéder aux projets privés
        assert not PermissionChecker.can_access_project(UserRole.USER, "private", False)
        assert PermissionChecker.can_access_project(UserRole.USER, "private", True)  # Propriétaire
        assert PermissionChecker.can_access_project(UserRole.ADMIN, "private", False)
    
    def test_can_access_project_restricted(self):
        """Test d'accès aux projets restreints"""
        # Propriétaire, modérateurs et admins peuvent accéder aux projets restreints
        assert not PermissionChecker.can_access_project(UserRole.USER, "restricted", False)
        assert PermissionChecker.can_access_project(UserRole.USER, "restricted", True)  # Propriétaire
        assert PermissionChecker.can_access_project(UserRole.MODERATOR, "restricted", False)
        assert PermissionChecker.can_access_project(UserRole.ADMIN, "restricted", False)
    
    def test_can_edit_project(self):
        """Test de permissions d'édition de projet"""
        # Seuls le propriétaire et l'admin peuvent éditer
        assert not PermissionChecker.can_edit_project(UserRole.USER, False)
        assert PermissionChecker.can_edit_project(UserRole.USER, True)  # Propriétaire
        assert not PermissionChecker.can_edit_project(UserRole.MODERATOR, False)
        assert PermissionChecker.can_edit_project(UserRole.ADMIN, False)
    
    def test_can_delete_project(self):
        """Test de permissions de suppression de projet"""
        # Seuls le propriétaire et l'admin peuvent supprimer
        assert not PermissionChecker.can_delete_project(UserRole.USER, False)
        assert PermissionChecker.can_delete_project(UserRole.USER, True)  # Propriétaire
        assert not PermissionChecker.can_delete_project(UserRole.MODERATOR, False)
        assert PermissionChecker.can_delete_project(UserRole.ADMIN, False)
    
    def test_can_moderate_comment(self):
        """Test de permissions de modération de commentaires"""
        # L'auteur peut modérer son propre commentaire
        assert PermissionChecker.can_moderate_comment(UserRole.USER, True)
        
        # Les utilisateurs ne peuvent pas modérer les commentaires des autres
        assert not PermissionChecker.can_moderate_comment(UserRole.USER, False)
        
        # Les modérateurs et admins peuvent modérer tous les commentaires
        assert PermissionChecker.can_moderate_comment(UserRole.MODERATOR, False)
        assert PermissionChecker.can_moderate_comment(UserRole.ADMIN, False)


class TestSecurityMiddleware:
    """Tests du middleware de sécurité"""
    
    @pytest.fixture
    def mock_request(self):
        """Fixture pour créer une requête mock"""
        request = Mock(spec=Request)
        request.method = "GET"
        request.url.path = "/api/v1/test"
        request.headers = {"user-agent": "test-agent"}
        request.client.host = "192.168.1.1"
        return request
    
    def test_is_sensitive_route(self, mock_request):
        """Test de détection des routes sensibles"""
        middleware = SecurityAuditMiddleware(None)
        
        # Routes sensibles
        mock_request.url.path = "/api/v1/auth/login"
        assert middleware._is_sensitive_route(mock_request.url.path)
        
        mock_request.url.path = "/api/v1/admin/users"
        assert middleware._is_sensitive_route(mock_request.url.path)
        
        mock_request.url.path = "/api/v1/permissions/grant"
        assert middleware._is_sensitive_route(mock_request.url.path)
        
        # Routes non sensibles
        mock_request.url.path = "/api/v1/projects"
        assert not middleware._is_sensitive_route(mock_request.url.path)
        
        mock_request.url.path = "/api/v1/health"
        assert not middleware._is_sensitive_route(mock_request.url.path)
    
    def test_extract_client_ip(self, mock_request):
        """Test d'extraction de l'IP client"""
        middleware = SecurityAuditMiddleware(None)
        
        # IP directe
        mock_request.headers = {}
        mock_request.client.host = "192.168.1.100"
        ip = middleware._get_client_ip(mock_request)
        assert ip == "192.168.1.100"
        
        # IP via X-Forwarded-For
        mock_request.headers = {"x-forwarded-for": "10.0.0.1, 192.168.1.1"}
        ip = middleware._get_client_ip(mock_request)
        assert ip == "10.0.0.1"
        
        # IP via X-Real-IP
        mock_request.headers = {"x-real-ip": "172.16.0.1"}
        ip = middleware._get_client_ip(mock_request)
        assert ip == "172.16.0.1"
    
    def test_determine_event_type(self, mock_request):
        """Test de détermination du type d'événement"""
        middleware = SecurityAuditMiddleware(None)
        
        # Login
        mock_request.url.path = "/api/v1/auth/login"
        mock_request.method = "POST"
        event_type = middleware._determine_event_type(mock_request, True, False)
        assert event_type == SecurityEventType.LOGIN_SUCCESS
        
        event_type = middleware._determine_event_type(mock_request, True, True)
        assert event_type == SecurityEventType.LOGIN_FAILED
        
        # Admin access
        mock_request.url.path = "/api/v1/admin/users"
        mock_request.method = "GET"
        event_type = middleware._determine_event_type(mock_request, True, False)
        assert event_type == SecurityEventType.ADMIN_ACCESS
        
        # Permissions
        mock_request.url.path = "/api/v1/permissions/grant"
        mock_request.method = "POST"
        event_type = middleware._determine_event_type(mock_request, True, False)
        assert event_type == SecurityEventType.PERMISSION_GRANTED
        
        mock_request.method = "DELETE"
        event_type = middleware._determine_event_type(mock_request, True, False)
        assert event_type == SecurityEventType.PERMISSION_REVOKED


class TestRateLimitMiddleware:
    """Tests du middleware de limitation de taux"""
    
    @pytest.fixture
    def rate_limit_middleware(self):
        """Fixture pour le middleware de limitation"""
        return RateLimitMiddleware(None, requests_per_minute=10)
    
    def test_rate_limit_init(self, rate_limit_middleware):
        """Test d'initialisation du middleware"""
        assert rate_limit_middleware.requests_per_minute == 10
        assert rate_limit_middleware.requests == {}
    
    def test_cleanup_old_requests(self, rate_limit_middleware):
        """Test de nettoyage des anciennes requêtes"""
        import time
        
        # Ajouter des requêtes anciennes et récentes
        now = time.time()
        old_time = now - 120  # 2 minutes ago
        
        rate_limit_middleware.requests = {
            "192.168.1.1": [old_time, now],
            "192.168.1.2": [old_time],
            "192.168.1.3": [now]
        }
        
        rate_limit_middleware._cleanup_old_requests(now)
        
        # Les anciennes requêtes doivent être supprimées
        assert len(rate_limit_middleware.requests["192.168.1.1"]) == 1
        assert "192.168.1.2" not in rate_limit_middleware.requests
        assert len(rate_limit_middleware.requests["192.168.1.3"]) == 1 