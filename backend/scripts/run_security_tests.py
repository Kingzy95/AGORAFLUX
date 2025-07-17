#!/usr/bin/env python3
"""
Script de tests autonome pour les composants critiques d'AgoraFlux
Tests de sécurité, authentification et permissions
"""

import sys
import os
import traceback
from datetime import datetime, timedelta

# Ajouter le répertoire parent au PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Imports du système
from app.core.security import SecurityUtils, PermissionChecker
from app.models.user import UserRole
from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.project import Project, ProjectStatus, ProjectVisibility
from app.models.permissions import ProjectPermission, ProjectRole
from app.services.permission_service import PermissionService
from app.core.security_logging import SecurityLogger, SecurityEventType, SecurityLog


class SecurityTestSuite:
    """Suite de tests pour la sécurité"""
    
    def __init__(self):
        self.tests_passed = 0
        self.tests_failed = 0
        self.db = SessionLocal()
    
    def run_test(self, test_name, test_func):
        """Exécute un test et affiche le résultat"""
        try:
            print(f"   🧪 {test_name}...", end=" ")
            test_func()
            print("✅")
            self.tests_passed += 1
        except Exception as e:
            print(f"❌ {str(e)}")
            self.tests_failed += 1
            if "--verbose" in sys.argv:
                traceback.print_exc()
    
    def test_password_security(self):
        """Tests de sécurité des mots de passe"""
        print("📋 Tests de sécurité des mots de passe")
        
        def test_password_hashing():
            password = "testpassword123"
            hash1 = SecurityUtils.get_password_hash(password)
            hash2 = SecurityUtils.get_password_hash(password)
            
            assert SecurityUtils.verify_password(password, hash1)
            assert SecurityUtils.verify_password(password, hash2)
            assert hash1 != hash2, "Les hashes doivent être différents (salt)"
            assert not SecurityUtils.verify_password("wrongpassword", hash1)
        
        def test_password_strength():
            # Mots de passe valides
            assert SecurityUtils.validate_password_strength("Password123")
            assert SecurityUtils.validate_password_strength("MyStr0ngP@ss")
            
            # Mots de passe invalides
            assert not SecurityUtils.validate_password_strength("123")  # Trop court
            assert not SecurityUtils.validate_password_strength("password")  # Pas de majuscule/chiffre
            assert not SecurityUtils.validate_password_strength("PASSWORD123")  # Pas de minuscule
            assert not SecurityUtils.validate_password_strength("Password")  # Pas de chiffre
        
        self.run_test("Hachage et vérification des mots de passe", test_password_hashing)
        self.run_test("Validation de la force des mots de passe", test_password_strength)
    
    def test_jwt_security(self):
        """Tests de sécurité JWT"""
        print("📋 Tests de sécurité JWT")
        
        def test_token_creation_verification():
            data = {"sub": "123", "email": "test@example.com", "role": "user"}
            
            # Token d'accès
            access_token = SecurityUtils.create_access_token(data)
            assert access_token is not None
            assert isinstance(access_token, str)
            
            payload = SecurityUtils.verify_token(access_token, "access")
            assert payload is not None
            assert payload["sub"] == "123"
            assert payload["email"] == "test@example.com"
            assert payload["type"] == "access"
            
            # Token de refresh
            refresh_token = SecurityUtils.create_refresh_token(data)
            assert refresh_token is not None
            
            refresh_payload = SecurityUtils.verify_token(refresh_token, "refresh")
            assert refresh_payload is not None
            assert refresh_payload["type"] == "refresh"
        
        def test_invalid_tokens():
            # Token invalide
            payload = SecurityUtils.verify_token("invalid.jwt.token", "access")
            assert payload is None
            
            # Mauvais type de token
            data = {"sub": "123", "type": "access"}
            access_token = SecurityUtils.create_access_token(data)
            payload = SecurityUtils.verify_token(access_token, "refresh")  # Cherche refresh mais c'est access
            assert payload is None
        
        self.run_test("Création et vérification des tokens", test_token_creation_verification)
        self.run_test("Gestion des tokens invalides", test_invalid_tokens)
    
    def test_role_permissions(self):
        """Tests des permissions par rôle"""
        print("📋 Tests des permissions par rôle")
        
        def test_admin_permissions():
            assert PermissionChecker.can_admin(UserRole.ADMIN)
            assert not PermissionChecker.can_admin(UserRole.MODERATOR)
            assert not PermissionChecker.can_admin(UserRole.USER)
        
        def test_moderation_permissions():
            assert PermissionChecker.can_moderate(UserRole.ADMIN)
            assert PermissionChecker.can_moderate(UserRole.MODERATOR)
            assert not PermissionChecker.can_moderate(UserRole.USER)
        
        def test_project_access_permissions():
            # Projets publics - tout le monde peut accéder
            assert PermissionChecker.can_access_project(UserRole.USER, "public", False)
            assert PermissionChecker.can_access_project(UserRole.MODERATOR, "public", False)
            assert PermissionChecker.can_access_project(UserRole.ADMIN, "public", False)
            
            # Projets privés - propriétaire et admin seulement
            assert not PermissionChecker.can_access_project(UserRole.USER, "private", False)
            assert PermissionChecker.can_access_project(UserRole.USER, "private", True)  # Propriétaire
            assert PermissionChecker.can_access_project(UserRole.ADMIN, "private", False)
            
            # Projets restreints - propriétaire, modérateurs et admins
            assert not PermissionChecker.can_access_project(UserRole.USER, "restricted", False)
            assert PermissionChecker.can_access_project(UserRole.USER, "restricted", True)  # Propriétaire
            assert PermissionChecker.can_access_project(UserRole.MODERATOR, "restricted", False)
            assert PermissionChecker.can_access_project(UserRole.ADMIN, "restricted", False)
        
        def test_edit_delete_permissions():
            # Édition - propriétaire et admin
            assert not PermissionChecker.can_edit_project(UserRole.USER, False)
            assert PermissionChecker.can_edit_project(UserRole.USER, True)  # Propriétaire
            assert not PermissionChecker.can_edit_project(UserRole.MODERATOR, False)
            assert PermissionChecker.can_edit_project(UserRole.ADMIN, False)
            
            # Suppression - même logique
            assert not PermissionChecker.can_delete_project(UserRole.USER, False)
            assert PermissionChecker.can_delete_project(UserRole.USER, True)  # Propriétaire
            assert not PermissionChecker.can_delete_project(UserRole.MODERATOR, False)
            assert PermissionChecker.can_delete_project(UserRole.ADMIN, False)
        
        def test_comment_moderation():
            # Modération des commentaires
            assert PermissionChecker.can_moderate_comment(UserRole.USER, True)  # Son propre commentaire
            assert not PermissionChecker.can_moderate_comment(UserRole.USER, False)  # Commentaire d'autrui
            assert PermissionChecker.can_moderate_comment(UserRole.MODERATOR, False)  # Tous les commentaires
            assert PermissionChecker.can_moderate_comment(UserRole.ADMIN, False)  # Tous les commentaires
        
        self.run_test("Permissions d'administration", test_admin_permissions)
        self.run_test("Permissions de modération", test_moderation_permissions)
        self.run_test("Permissions d'accès aux projets", test_project_access_permissions)
        self.run_test("Permissions d'édition/suppression", test_edit_delete_permissions)
        self.run_test("Permissions de modération des commentaires", test_comment_moderation)
    
    def test_project_permissions(self):
        """Tests des permissions par projet"""
        print("📋 Tests des permissions par projet")
        
        def test_permission_defaults():
            # Permissions par défaut pour chaque rôle
            admin_perms = ProjectPermission.get_default_permissions_for_role(ProjectRole.ADMIN)
            assert admin_perms["can_view_project"] is True
            assert admin_perms["can_edit_project"] is True
            assert admin_perms["can_delete_project"] is True
            assert admin_perms["can_manage_users"] is True
            assert admin_perms["can_moderate_comments"] is True
            assert admin_perms["can_export_data"] is True
            
            moderator_perms = ProjectPermission.get_default_permissions_for_role(ProjectRole.MODERATOR)
            assert moderator_perms["can_view_project"] is True
            assert moderator_perms["can_upload_datasets"] is True
            assert moderator_perms["can_moderate_comments"] is True
            assert moderator_perms["can_export_data"] is True
            assert moderator_perms["can_edit_project"] is False
            assert moderator_perms["can_delete_project"] is False
            assert moderator_perms["can_manage_users"] is False
            
            user_perms = ProjectPermission.get_default_permissions_for_role(ProjectRole.USER)
            assert user_perms["can_view_project"] is True
            assert user_perms["can_create_comments"] is True
            assert user_perms["can_upload_datasets"] is True
            assert user_perms["can_edit_project"] is False
            assert user_perms["can_moderate_comments"] is False
            assert user_perms["can_export_data"] is False
        
        def test_permission_application():
            # Test d'application des permissions par défaut
            permission = ProjectPermission(
                user_id=1,
                project_id=1,
                role=ProjectRole.MODERATOR
            )
            
            permission.apply_role_permissions()
            
            assert permission.can_view_project is True
            assert permission.can_moderate_comments is True
            assert permission.can_edit_project is False
        
        self.run_test("Permissions par défaut des rôles", test_permission_defaults)
        self.run_test("Application des permissions", test_permission_application)
    
    def test_security_logging(self):
        """Tests du système de journalisation de sécurité"""
        print("📋 Tests de journalisation de sécurité")
        
        def test_log_creation():
            logger = SecurityLogger(self.db)
            
            log_entry = logger.log_event(
                event_type=SecurityEventType.LOGIN_SUCCESS,
                user_email="test@example.com",
                ip_address="192.168.1.1",
                action="test_login",
                success=True,
                additional_data={"test": True}
            )
            
            assert log_entry.id is not None
            assert log_entry.event_type == SecurityEventType.LOGIN_SUCCESS
            assert log_entry.user_email == "test@example.com"
            assert log_entry.ip_address == "192.168.1.1"
            assert log_entry.success is True
            assert '"test": true' in log_entry.additional_data
        
        def test_different_event_types():
            logger = SecurityLogger(self.db)
            
            # Test différents types d'événements
            events_to_test = [
                SecurityEventType.LOGIN_FAILED,
                SecurityEventType.ADMIN_ACCESS,
                SecurityEventType.SUSPICIOUS_ACTIVITY,
                SecurityEventType.DATA_EXPORTED,
                SecurityEventType.PERMISSION_GRANTED
            ]
            
            for event_type in events_to_test:
                log_entry = logger.log_event(
                    event_type=event_type,
                    ip_address="127.0.0.1",
                    action="test",
                    success=True
                )
                assert log_entry.event_type == event_type
        
        self.run_test("Création d'événements de sécurité", test_log_creation)
        self.run_test("Différents types d'événements", test_different_event_types)
    
    def run_all_tests(self):
        """Exécute tous les tests de sécurité"""
        print("🛡️  SUITE DE TESTS DE SÉCURITÉ AGORAFLUX")
        print("=" * 60)
        print(f"Début des tests : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        try:
            self.test_password_security()
            print()
            
            self.test_jwt_security()
            print()
            
            self.test_role_permissions()
            print()
            
            self.test_project_permissions()
            print()
            
            self.test_security_logging()
            print()
            
        except Exception as e:
            print(f"❌ Erreur fatale : {e}")
            if "--verbose" in sys.argv:
                traceback.print_exc()
        
        finally:
            self.db.close()
        
        # Résultats finaux
        total_tests = self.tests_passed + self.tests_failed
        success_rate = (self.tests_passed / total_tests * 100) if total_tests > 0 else 0
        
        print("=" * 60)
        print("📊 RÉSULTATS DES TESTS")
        print(f"   ✅ Tests réussis : {self.tests_passed}")
        print(f"   ❌ Tests échoués : {self.tests_failed}")
        print(f"   📈 Taux de réussite : {success_rate:.1f}%")
        
        if self.tests_failed == 0:
            print("\n🎉 TOUS LES TESTS DE SÉCURITÉ PASSENT !")
            print("   • Système d'authentification sécurisé")
            print("   • Gestion robuste des permissions")
            print("   • Journalisation de sécurité active")
            print("   • Protection contre les attaques")
            return True
        else:
            print(f"\n⚠️  {self.tests_failed} TEST(S) ÉCHOUÉ(S)")
            print("   Veuillez corriger les problèmes avant la mise en production")
            return False


if __name__ == "__main__":
    # Créer les tables si elles n'existent pas
    Base.metadata.create_all(bind=engine)
    
    # Exécuter les tests
    test_suite = SecurityTestSuite()
    success = test_suite.run_all_tests()
    
    sys.exit(0 if success else 1) 