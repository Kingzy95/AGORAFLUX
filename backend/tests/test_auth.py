"""
Tests pour le système d'authentification
Composant critique : sécurité, connexion, tokens JWT
"""

import pytest
from fastapi import status
from app.core.security import SecurityUtils
from app.models.user import UserRole


class TestAuthentication:
    """Tests du système d'authentification"""
    
    def test_register_user_success(self, client):
        """Test d'enregistrement d'un nouvel utilisateur"""
        user_data = {
            "email": "newuser@example.com",
            "password": "newpassword123",
            "first_name": "New",
            "last_name": "User"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["first_name"] == user_data["first_name"]
        assert data["role"] == UserRole.USER.value
        assert data["is_active"] is True
    
    def test_register_duplicate_email(self, client, test_user):
        """Test d'enregistrement avec email déjà existant"""
        user_data = {
            "email": test_user.email,
            "password": "newpassword123",
            "first_name": "Duplicate",
            "last_name": "User"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "déjà enregistré" in response.json()["detail"]
    
    def test_register_weak_password(self, client):
        """Test d'enregistrement avec mot de passe faible"""
        user_data = {
            "email": "weakpass@example.com",
            "password": "123",  # Trop court
            "first_name": "Weak",
            "last_name": "Password"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "faible" in response.json()["detail"]
    
    def test_login_success(self, client, test_user):
        """Test de connexion réussie"""
        login_data = {
            "email": test_user.email,
            "password": "testpassword123"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == test_user.email
    
    def test_login_invalid_credentials(self, client, test_user):
        """Test de connexion avec identifiants invalides"""
        login_data = {
            "email": test_user.email,
            "password": "wrongpassword"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "invalides" in response.json()["detail"]
    
    def test_login_nonexistent_user(self, client):
        """Test de connexion avec utilisateur inexistant"""
        login_data = {
            "email": "notfound@example.com",
            "password": "somepassword"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_protected_route_without_token(self, client):
        """Test d'accès à une route protégée sans token"""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_protected_route_with_valid_token(self, client, auth_headers, test_user):
        """Test d'accès à une route protégée avec token valide"""
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == test_user.email
        assert data["role"] == test_user.role.value
    
    def test_protected_route_with_invalid_token(self, client):
        """Test d'accès à une route protégée avec token invalide"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_change_password_success(self, client, auth_headers, test_user):
        """Test de changement de mot de passe réussi"""
        password_data = {
            "current_password": "testpassword123",
            "new_password": "newtestpassword123"
        }
        
        response = client.post("/api/v1/auth/change-password", json=password_data, headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Vérifier que l'ancien mot de passe ne fonctionne plus
        login_data = {
            "email": test_user.email,
            "password": "testpassword123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        assert login_response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Vérifier que le nouveau mot de passe fonctionne
        new_login_data = {
            "email": test_user.email,
            "password": "newtestpassword123"
        }
        new_login_response = client.post("/api/v1/auth/login", json=new_login_data)
        assert new_login_response.status_code == status.HTTP_200_OK
    
    def test_change_password_wrong_current(self, client, auth_headers):
        """Test de changement de mot de passe avec ancien mot de passe incorrect"""
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newtestpassword123"
        }
        
        response = client.post("/api/v1/auth/change-password", json=password_data, headers=auth_headers)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestJWTSecurity:
    """Tests de sécurité des tokens JWT"""
    
    def test_token_creation_and_verification(self):
        """Test de création et vérification de token"""
        data = {"sub": "123", "email": "test@example.com", "role": "user"}
        
        # Créer un token
        token = SecurityUtils.create_access_token(data)
        assert token is not None
        assert isinstance(token, str)
        
        # Vérifier le token
        payload = SecurityUtils.verify_token(token, "access")
        assert payload is not None
        assert payload["sub"] == "123"
        assert payload["email"] == "test@example.com"
        assert payload["type"] == "access"
    
    def test_refresh_token_creation(self):
        """Test de création de refresh token"""
        data = {"sub": "123", "email": "test@example.com"}
        
        token = SecurityUtils.create_refresh_token(data)
        assert token is not None
        
        payload = SecurityUtils.verify_token(token, "refresh")
        assert payload is not None
        assert payload["type"] == "refresh"
    
    def test_invalid_token_verification(self):
        """Test de vérification de token invalide"""
        invalid_token = "invalid.jwt.token"
        
        payload = SecurityUtils.verify_token(invalid_token, "access")
        assert payload is None
    
    def test_expired_token_verification(self):
        """Test de vérification de token expiré"""
        from datetime import datetime, timedelta
        import jwt
        from app.core.config import settings
        
        # Créer un token expiré
        expired_data = {
            "sub": "123",
            "email": "test@example.com",
            "type": "access",
            "exp": datetime.utcnow() - timedelta(hours=1)  # Expiré il y a 1 heure
        }
        
        expired_token = jwt.encode(expired_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        payload = SecurityUtils.verify_token(expired_token, "access")
        assert payload is None


class TestPasswordSecurity:
    """Tests de sécurité des mots de passe"""
    
    def test_password_hashing(self):
        """Test de hachage de mot de passe"""
        password = "testpassword123"
        
        hash1 = SecurityUtils.get_password_hash(password)
        hash2 = SecurityUtils.get_password_hash(password)
        
        # Les hashes doivent être différents (salt aléatoire)
        assert hash1 != hash2
        assert hash1 != password
        
        # Mais les deux doivent vérifier le même mot de passe
        assert SecurityUtils.verify_password(password, hash1)
        assert SecurityUtils.verify_password(password, hash2)
    
    def test_password_verification(self):
        """Test de vérification de mot de passe"""
        password = "mypassword123"
        wrong_password = "wrongpassword"
        
        password_hash = SecurityUtils.get_password_hash(password)
        
        assert SecurityUtils.verify_password(password, password_hash)
        assert not SecurityUtils.verify_password(wrong_password, password_hash)
    
    def test_password_strength_validation(self):
        """Test de validation de force de mot de passe"""
        # Mots de passe valides
        assert SecurityUtils.validate_password_strength("Password123")
        assert SecurityUtils.validate_password_strength("MyStr0ngP@ss")
        
        # Mots de passe invalides
        assert not SecurityUtils.validate_password_strength("123")  # Trop court
        assert not SecurityUtils.validate_password_strength("password")  # Pas de majuscule ni chiffre
        assert not SecurityUtils.validate_password_strength("PASSWORD123")  # Pas de minuscule
        assert not SecurityUtils.validate_password_strength("Password")  # Pas de chiffre 