# Documentation API d'Authentification AgoraFlux

## Vue d'ensemble

L'API d'authentification AgoraFlux fournit un système complet d'authentification JWT avec gestion des rôles, sécurité avancée et protection contre les attaques.

## Fonctionnalités Principales

### 🔐 Authentification JWT
- Tokens d'accès (30 minutes) et de rafraîchissement (7 jours)
- Signature sécurisée avec clé secrète
- Validation automatique des tokens

### 👥 Gestion des Rôles
- **ADMIN** : Accès complet à tous les endpoints
- **MODERATOR** : Accès aux fonctions de modération
- **USER** : Accès aux fonctions utilisateur de base

### 🛡️ Sécurité
- Rate limiting : 5 tentatives de connexion par 15 minutes
- Verrouillage automatique des comptes après échecs
- Hachage des mots de passe avec bcrypt (12 rounds)
- Validation de la force des mots de passe

## Endpoints Disponibles

### Authentification de Base

#### `POST /api/v1/auth/login`
Connexion utilisateur avec email et mot de passe.

**Requête :**
```json
{
  "email": "admin@agoraflux.fr",
  "password": "admin123"
}
```

**Réponse :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

#### `POST /api/v1/auth/refresh`
Rafraîchissement du token d'accès.

**Requête :**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `GET /api/v1/auth/me`
Informations de l'utilisateur connecté.

**Headers :** `Authorization: Bearer <token>`

**Réponse :**
```json
{
  "id": 9,
  "email": "admin@agoraflux.fr",
  "first_name": "Admin",
  "last_name": "AgoraFlux",
  "role": "admin",
  "is_active": true,
  "is_verified": true,
  "created_at": "2025-07-04T00:13:58.673968",
  "last_login": "2025-07-04T00:14:16.008816"
}
```

### Gestion des Utilisateurs

#### `POST /api/v1/auth/register`
Enregistrement d'un nouvel utilisateur.

**Requête :**
```json
{
  "email": "nouveau@agoraflux.fr",
  "password": "MotDePasse123",
  "first_name": "Nouveau",
  "last_name": "Utilisateur"
}
```

#### `POST /api/v1/auth/change-password`
Changement de mot de passe.

**Headers :** `Authorization: Bearer <token>`

**Requête :**
```json
{
  "current_password": "ancien_mot_de_passe",
  "new_password": "nouveau_mot_de_passe",
  "confirm_password": "nouveau_mot_de_passe"
}
```

### Endpoints Administrateur

#### `GET /api/v1/auth/users`
Liste de tous les utilisateurs (admin seulement).

**Headers :** `Authorization: Bearer <admin_token>`

**Réponse :**
```json
[
  {
    "id": 9,
    "email": "admin@agoraflux.fr",
    "first_name": "Admin",
    "last_name": "AgoraFlux",
    "role": "admin",
    "is_active": true,
    "is_verified": true,
    "created_at": "2025-07-04T00:13:58.673968"
  }
]
```

#### `PUT /api/v1/auth/users/{user_id}/role`
Modification du rôle d'un utilisateur (admin seulement).

#### `PUT /api/v1/auth/users/{user_id}/activate`
Activation d'un compte utilisateur (admin seulement).

#### `PUT /api/v1/auth/users/{user_id}/deactivate`
Désactivation d'un compte utilisateur (admin seulement).

### Endpoints Utilitaires

#### `GET /api/v1/auth/status`
Statut du système d'authentification.

**Réponse :**
```json
{
  "status": "operational",
  "features": {
    "jwt_authentication": true,
    "role_based_access": true,
    "rate_limiting": true,
    "account_locking": true,
    "email_verification": true
  }
}
```

#### `POST /api/v1/auth/logout`
Déconnexion utilisateur.

#### `POST /api/v1/auth/verify-email/{user_id}`
Vérification d'email (admin seulement).

## Comptes de Test

### Administrateur
- **Email :** admin@agoraflux.fr
- **Mot de passe :** admin123
- **Rôle :** ADMIN

### Modérateur
- **Email :** moderateur@agoraflux.fr
- **Mot de passe :** mod123
- **Rôle :** MODERATOR

### Utilisateurs
- **Email :** utilisateur@agoraflux.fr
- **Mot de passe :** user123
- **Rôle :** USER

- **Email :** marie.dupont@agoraflux.fr
- **Mot de passe :** marie123
- **Rôle :** USER

## Codes d'Erreur

| Code | Description |
|------|-------------|
| 400 | Données invalides |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource non trouvée |
| 422 | Erreur de validation |
| 429 | Trop de tentatives |
| 500 | Erreur serveur |

## Sécurité

### Protection Anti-Bruteforce
- Maximum 5 tentatives de connexion par IP
- Verrouillage de 15 minutes après échecs
- Compteur de tentatives par utilisateur

### Validation des Mots de Passe
- Minimum 8 caractères
- Hachage bcrypt avec 12 rounds
- Validation de la force

### Tokens JWT
- Algorithme HS256
- Expiration automatique
- Validation de signature

## Tests

Le script `test_api.py` valide automatiquement :
- ✅ Authentification JWT
- ✅ Gestion des rôles
- ✅ Rafraîchissement des tokens
- ✅ Protection des endpoints
- ✅ Validation des tokens
- ✅ Gestion des erreurs

**Commande :** `python test_api.py`

## Documentation Interactive

L'API est documentée automatiquement avec Swagger UI :
- **URL :** http://127.0.0.1:8000/docs
- **ReDoc :** http://127.0.0.1:8000/redoc

## Configuration

Variables d'environnement importantes :
```env
SECRET_KEY=votre-cle-secrete-super-forte
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_DURATION=900
```

## Prochaines Étapes

1. **Interface utilisateur** : Développement du frontend React/Vue
2. **Endpoints CRUD** : Projets, datasets, commentaires
3. **Tests unitaires** : Couverture complète des services
4. **Monitoring** : Logs et métriques de sécurité

---

**Statut :** ✅ Complètement implémenté et testé
**Version :** 1.0.0
**Date :** 2025-07-04 