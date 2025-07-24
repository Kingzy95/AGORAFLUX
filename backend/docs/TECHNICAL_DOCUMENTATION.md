# Documentation Technique AgoraFlux

## Table des Matières
1. [Architecture Générale](#architecture-générale)
2. [Système de Sécurité](#système-de-sécurité)
3. [Authentification et Autorisation](#authentification-et-autorisation)
4. [Gestion des Permissions](#gestion-des-permissions)
5. [Journalisation de Sécurité](#journalisation-de-sécurité)
6. [Middleware de Protection](#middleware-de-protection)
7. [Tests Automatisés](#tests-automatisés)
8. [Configuration et Déploiement](#configuration-et-déploiement)

---

## Architecture Générale

### Stack Technologique
- **Backend**: FastAPI (Python 3.11+)
- **Base de données**: PostgreSQL 14+
- **ORM**: SQLAlchemy 2.0
- **Authentification**: JWT (JSON Web Tokens)
- **Sécurité**: Bcrypt pour le hachage des mots de passe
- **Validation**: Pydantic
- **Tests**: Pytest
- **Documentation**: OpenAPI/Swagger

### Structure du Projet
```
backend/
├── app/
│   ├── api/                    # Endpoints REST
│   ├── core/                   # Configuration et utilitaires
│   ├── models/                 # Modèles SQLAlchemy
│   ├── schemas/                # Schémas Pydantic
│   ├── services/               # Logique métier
│   ├── middleware/             # Middleware de sécurité
│   └── main.py                 # Point d'entrée FastAPI
├── tests/                      # Tests automatisés
├── scripts/                    # Scripts d'administration
└── docs/                       # Documentation
```

---

## Système de Sécurité

### Vue d'Ensemble

AgoraFlux implémente un système de sécurité à plusieurs niveaux conforme aux exigences :

1. **Authentification robuste** avec JWT
2. **Autorisation granulaire** basée sur les rôles
3. **Journalisation complète** des événements de sécurité
4. **Protection proactive** contre les attaques

### Exigences de Sécurité Satisfaites

1. **Gestion d'authentification avec rôles (admin/modérateur/utilisateur)**
   - Architecture JWT complète avec refresh tokens
   - 3 rôles hiérarchiques avec permissions héritées
   - Protection anti-bruteforce (5 tentatives max, 15min lockout)

2. **Sécurisation des routes sensibles selon les rôles**
   - Middleware automatique détectant 8+ patterns de routes critiques
   - Protection temps réel avec journalisation automatique
   - Rate limiting configurable (120 req/min par défaut)

3. **Journalisation des connexions et accès sensibles**
   - 15+ types d'événements automatiquement journalisés
   - Conservation sécurisée 12 mois avec intégrité protégée
   - Détection proactive d'activités suspectes

4. **Politiques de mot de passe et conditions d'usage claires**
   - Validation 8+ caractères, complexité obligatoire (maj/min/chiffre)
   - Hachage bcrypt 12 rounds (résistant bruteforce)
   - Documentation complète des politiques utilisateur

---

## Authentification et Autorisation

### Architecture JWT

Le système d'authentification repose sur JSON Web Tokens avec double token :

#### Access Token (30 minutes)
```python
{
    "sub": "user_id",
    "email": "user@example.com", 
    "role": "admin|moderateur|utilisateur",
    "type": "access",
    "exp": timestamp,
    "iat": timestamp
}
```

#### Refresh Token (7 jours)
```python
{
    "sub": "user_id",
    "type": "refresh", 
    "exp": timestamp,
    "iat": timestamp
}
```

### Flux d'Authentification

1. **Login** : Validation email/password → génération access + refresh tokens
2. **Requêtes API** : Access token dans header Authorization
3. **Refresh** : Refresh token → nouveau access token
4. **Logout** : Invalidation des tokens côté client

### Hachage des Mots de Passe

```python
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Résistant aux attaques par force brute
)
```

---

## Gestion des Permissions

### Modèle de Rôles

#### Rôles Globaux
1. **Administrateur (`admin`)**
   - Accès complet au système
   - Gestion des utilisateurs
   - Configuration globale

2. **Modérateur (`moderator`)**
   - Modération des contenus
   - Gestion des signalements
   - Accès étendu aux projets

3. **Utilisateur (`user`)**
   - Accès standard
   - Création de projets
   - Participation aux discussions

#### Rôles par Projet
1. **Admin de projet**
   - Gestion complète du projet
   - Attribution des permissions
   - Suppression/modification

2. **Modérateur de projet**
   - Modération des commentaires
   - Upload de données
   - Export des données

3. **Utilisateur de projet**
   - Lecture du projet
   - Création de commentaires
   - Upload de données limitées

### Matrice des Permissions

| Permission | Admin Global | Modérateur | Utilisateur | Admin Projet | Mod. Projet | User Projet |
|------------|--------------|------------|--------------|--------------|-------------|-------------|
| Voir projet | OUI | OUI | OUI* | OUI | OUI | OUI |
| Éditer projet | OUI | NON | NON | OUI | NON | NON |
| Supprimer projet | OUI | NON | NON | OUI | NON | NON |
| Gérer utilisateurs | OUI | NON | NON | OUI | NON | NON |
| Modérer commentaires | OUI | OUI | NON | OUI | OUI | NON |
| Upload datasets | OUI | OUI | OUI | OUI | OUI | OUI |
| Supprimer datasets | OUI | NON | NON | OUI | NON | NON |
| Exporter données | OUI | OUI | NON | OUI | OUI | NON |

*Selon la visibilité du projet

### Héritage des Permissions

Les permissions sont héritées selon la hiérarchie :
- Les **admins globaux** héritent des droits d'admin sur tous les projets
- Les **modérateurs globaux** héritent des droits de modération
- Les **utilisateurs** nécessitent des permissions explicites

---

## Journalisation de Sécurité

### Types d'Événements

#### Authentification
- `LOGIN_SUCCESS` : Connexion réussie
- `LOGIN_FAILED` : Échec de connexion
- `LOGOUT` : Déconnexion
- `PASSWORD_CHANGE` : Changement de mot de passe
- `ACCOUNT_LOCKED` : Verrouillage de compte

#### Accès Sensibles
- `ADMIN_ACCESS` : Accès administrateur
- `MODERATOR_ACCESS` : Accès modérateur
- `UNAUTHORIZED_ACCESS_ATTEMPT` : Tentative d'accès non autorisé
- `PERMISSION_GRANTED` : Attribution de permission
- `PERMISSION_REVOKED` : Révocation de permission

#### Actions Critiques
- `PROJECT_CREATED` : Création de projet
- `PROJECT_DELETED` : Suppression de projet
- `DATA_EXPORTED` : Export de données
- `USER_INVITED` : Invitation d'utilisateur
- `COMMENT_MODERATED` : Modération de commentaire

#### Sécurité
- `SUSPICIOUS_ACTIVITY` : Activité suspecte détectée
- `MULTIPLE_FAILED_LOGINS` : Tentatives multiples échouées

### Structure des Logs

```python
class SecurityLog:
    id: int
    event_type: SecurityEventType
    user_id: Optional[int]
    user_email: Optional[str]
    user_role: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    resource_type: Optional[str]  # project, user, comment
    resource_id: Optional[int]
    action: Optional[str]
    success: bool
    error_message: Optional[str]
    additional_data: Optional[str]  # JSON
    timestamp: datetime
```

### Retention et Sécurité

- **Conservation**: 12 mois minimum
- **Intégrité**: Protection contre la modification
- **Confidentialité**: Chiffrement des données sensibles
- **Audit**: Logs des accès aux logs eux-mêmes

---

## Middleware de Protection

### SecurityAuditMiddleware

#### Fonctionnalités
- **Détection automatique** des routes sensibles
- **Extraction des informations** utilisateur
- **Journalisation en temps réel** des événements
- **Détection d'activités suspectes**

#### Routes Sensibles (Patterns)
```python
SENSITIVE_PATTERNS = [
    r"^/api/v1/auth/.*",           # Authentification
    r"^/api/v1/admin/.*",          # Administration
    r"^/api/v1/permissions/.*",    # Permissions
    r"^/api/v1/exports/.*",        # Exports
    r"^/api/v1/moderation/.*",     # Modération
    r".*/(delete|remove)/.*",      # Suppressions
    r".*/moderate$",               # Actions modération
    r"^/api/v1/.*/(users|roles)/.*" # Gestion utilisateurs
]
```

### RateLimitMiddleware

#### Configuration
- **Limite par défaut**: 120 requêtes/minute
- **Fenêtre glissante**: 60 secondes
- **Stockage**: Redis ou mémoire
- **Exemptions**: Routes health check

#### Implémentation
```python
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 120):
        super().__init__(app)
        self.limit = requests_per_minute
        self.window = 60  # secondes
```

---

## Tests Automatisés

### Suite de Tests de Sécurité

```
SUITE DE TESTS DE SÉCURITÉ AGORAFLUX
============================================================
RÉSULTATS DES TESTS
   Tests réussis : 13
   Tests échoués : 0
   Taux de réussite : 100.0%

TOUS LES TESTS DE SÉCURITÉ PASSENT !
   • Système d'authentification sécurisé
   • Gestion robuste des permissions
   • Journalisation de sécurité active
   • Protection contre les attaques
```

### Tests Implémentés

#### SecurityLogging (5 tests)
- Test de création des logs de sécurité
- Validation des types d'événements
- Vérification de l'intégrité des données
- Test de la rétention des logs
- Validation des recherches dans les logs

#### PermissionChecker (8 tests)
- Vérification des rôles globaux
- Test des permissions par projet
- Validation de l'héritage des droits
- Test des restrictions d'accès
- Vérification des cas d'erreur

### Commandes de Test

```bash
# Tests de sécurité uniquement
pytest tests/test_security.py -v

# Tests complets avec couverture
pytest tests/ --cov=app --cov-report=html

# Tests spécifiques aux permissions
pytest tests/test_security.py::test_permission_checker -v
```

---

## Configuration et Déploiement

### Variables d'Environnement

#### Sécurité
```env
SECRET_KEY=votre-cle-secrete-super-forte-changez-moi
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
PASSWORD_MIN_LENGTH=8
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_DURATION=900  # 15 minutes
```

#### Base de Données
```env
DATABASE_URL=postgresql://user:password@localhost:5432/agoraflux
DATABASE_ECHO=false
```

#### CORS et Hôtes
```env
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
ALLOWED_HOSTS=["localhost","127.0.0.1","0.0.0.0"]
```

### Initialisation de la Base

```bash
# Créer les tables de sécurité
python scripts/create_security_tables.py

# Optionnel : Migration complète du système
python scripts/update_security_system.py
```

### Vérification du Déploiement

```bash
# Test des composants critiques
python scripts/run_security_tests.py

# Vérification de l'application
python -c "from app.main import app; print('Application prête')"
```

### Checklist de Sécurité

#### Avant Production
- [ ] Changer la `SECRET_KEY`
- [ ] Configurer HTTPS
- [ ] Limiter les CORS origins
- [ ] Activer les logs de production
- [ ] Configurer la sauvegarde des logs
- [ ] Tester tous les scenarios d'attaque
- [ ] Vérifier les permissions par défaut
- [ ] Documenter les procédures d'incident

#### Monitoring
- [ ] Surveillance des tentatives de connexion
- [ ] Alertes sur activités suspectes
- [ ] Audit régulier des permissions
- [ ] Sauvegarde des logs de sécurité
- [ ] Tests de pénétration périodiques

---

## Maintenance et Évolution

### Scripts d'Administration

#### Gestion des Utilisateurs
```bash
# Créer un administrateur
python scripts/create_admin.py --email admin@domain.com

# Lister les utilisateurs verrouillés
python scripts/list_locked_users.py

# Débloquer un utilisateur
python scripts/unlock_user.py --email user@domain.com
```

#### Audit et Logs
```bash
# Analyser les logs de sécurité
python scripts/analyze_security_logs.py --days 7

# Exporter les logs pour audit
python scripts/export_logs.py --start-date 2024-01-01 --format json

# Nettoyer les anciens logs
python scripts/cleanup_old_logs.py --older-than 365
```

### Mise à Jour du Système

```bash
# Sauvegarder la configuration actuelle
python scripts/backup_security_config.py

# Appliquer les mises à jour de sécurité
python scripts/update_security_system.py

# Vérifier l'intégrité après mise à jour
python scripts/verify_security_integrity.py
```

---
