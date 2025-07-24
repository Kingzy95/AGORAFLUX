# Documentation API d'Authentification AgoraFlux

## Vue d'ensemble

L'API d'authentification AgoraFlux fournit un système complet d'authentification JWT avec gestion des rôles, sécurité avancée et protection contre les attaques.

## Fonctionnalités Principales

### Authentification JWT
- Tokens d'accès (30 minutes) et de rafraîchissement (7 jours)
- Signature sécurisée avec clé secrète
- Validation automatique des tokens

### Gestion des Rôles
- **ADMIN** : Accès complet à tous les endpoints
- **MODERATOR** : Accès aux fonctions de modération
- **USER** : Accès aux fonctions utilisateur de base

### Sécurité
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
Renouvellement du token d'accès avec le token de rafraîchissement.

**Requête :**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Réponse :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

#### `POST /api/v1/auth/logout`
Déconnexion utilisateur (invalidation des tokens).

**Headers :**
```
Authorization: Bearer <access_token>
```

**Réponse :**
```json
{
  "message": "Déconnexion réussie"
}
```

### Gestion des Comptes

#### `POST /api/v1/auth/register`
Création d'un nouveau compte utilisateur.

**Requête :**
```json
{
  "email": "nouveau@agoraflux.fr",
  "password": "motDePasseFort123!",
  "first_name": "Nouveau",
  "last_name": "Utilisateur"
}
```

**Réponse :**
```json
{
  "message": "Compte créé avec succès",
  "user_id": 123
}
```

#### `POST /api/v1/auth/change-password`
Changement du mot de passe utilisateur.

**Headers :**
```
Authorization: Bearer <access_token>
```

**Requête :**
```json
{
  "current_password": "ancienMotDePasse",
  "new_password": "nouveauMotDePasseFort123!"
}
```

**Réponse :**
```json
{
  "message": "Mot de passe modifié avec succès"
}
```

### Validation et Profil

#### `GET /api/v1/auth/me`
Récupération du profil utilisateur actuel.

**Headers :**
```
Authorization: Bearer <access_token>
```

**Réponse :**
```json
{
  "id": 1,
  "email": "admin@agoraflux.fr",
  "first_name": "Admin",
  "last_name": "AgoraFlux",
  "role": "admin",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### `POST /api/v1/auth/validate-token`
Validation d'un token JWT.

**Requête :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Réponse :**
```json
{
  "valid": true,
  "user_id": 1,
  "email": "admin@agoraflux.fr",
  "role": "admin"
}
```

## Gestion des Erreurs

### Codes d'Erreur HTTP

- **200** : Succès
- **400** : Requête invalide (données manquantes/incorrectes)
- **401** : Non authentifié (token invalide/expiré)
- **403** : Accès interdit (permissions insuffisantes)
- **422** : Erreur de validation (format de données incorrect)
- **429** : Trop de tentatives (rate limiting activé)
- **500** : Erreur serveur interne

### Exemples de Réponses d'Erreur

#### Erreur d'authentification (401)
```json
{
  "detail": "Could not validate credentials",
  "error_code": "INVALID_TOKEN"
}
```

#### Erreur de validation (422)
```json
{
  "detail": [
    {
      "loc": ["body", "password"],
      "msg": "Password must be at least 8 characters long",
      "type": "value_error"
    }
  ]
}
```

#### Rate limiting (429)
```json
{
  "detail": "Too many login attempts. Please try again in 15 minutes.",
  "retry_after": 900
}
```

## Utilisation des Tokens

### Format du Token JWT

Les tokens JWT contiennent les informations suivantes dans leur payload :

```json
{
  "sub": "1",
  "email": "admin@agoraflux.fr",
  "role": "admin",
  "type": "access",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### Headers d'Authentification

Pour tous les endpoints protégés, incluez le token dans le header Authorization :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Cycle de Vie des Tokens

1. **Connexion** : Réception des tokens d'accès et de rafraîchissement
2. **Utilisation** : Token d'accès pour les requêtes API (30 min)
3. **Renouvellement** : Token de rafraîchissement pour obtenir un nouveau token d'accès
4. **Expiration** : Token de rafraîchissement expire après 7 jours
5. **Déconnexion** : Invalidation explicite des tokens

## Comptes de Test

Pour tester l'API, utilisez les comptes préconfigurés :

### Administrateur
- **Email :** admin@agoraflux.fr
- **Mot de passe :** admin123
- **Rôle :** ADMIN

### Modérateur
- **Email :** moderateur@agoraflux.fr
- **Mot de passe :** mod123
- **Rôle :** MODERATOR

### Utilisateur Standard
- **Email :** utilisateur@agoraflux.fr
- **Mot de passe :** user123
- **Rôle :** USER

### Utilisateur Marie
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
- Authentification JWT
- Gestion des rôles
- Rafraîchissement des tokens
- Protection des endpoints
- Validation des tokens
- Gestion des erreurs

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

**Statut :** Complètement implémenté et testé
**Version :** 1.0.0
**Date :** 2025-07-04 