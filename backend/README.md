# AgoraFlux Backend

Plateforme de simulation et collaboration citoyenne en ligne pour proposer, visualiser et débattre autour de données publiques enrichies.

## 🚀 Démarrage rapide avec Docker

### 1. Lancer PostgreSQL et pgAdmin
```bash
# Démarrer les services
docker-compose up -d

# Vérifier que les services sont actifs
docker-compose ps
```

### 2. Créer le fichier .env
```bash
# Copier le fichier d'exemple
cp env.example .env

# Modifier si nécessaire (les valeurs par défaut fonctionnent)
```

### 3. Installer les dépendances Python
```bash
# Créer l'environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Installer les dépendances
pip install -r requirements.txt
```

### 4. Initialiser la base de données
```bash
# Lancer le script d'initialisation
python scripts/init_postgres.py
```

### 5. Démarrer l'API
```bash
# Démarrer le serveur FastAPI
uvicorn app.main:app --reload
```

## 🌐 Accès aux services

- **API FastAPI** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs
- **pgAdmin** : http://localhost:8081
  - Email : admin@agoraflux.fr
  - Mot de passe : admin

## 🔐 Comptes de test

- **Admin** : admin@agoraflux.fr / admin123
- **Modérateur** : moderateur@agoraflux.fr / mod123
- **Utilisateur** : utilisateur@agoraflux.fr / user123
- **Marie** : marie.dupont@agoraflux.fr / user123

## 📊 Base de données

La base PostgreSQL est accessible via :
- **Host** : localhost
- **Port** : 5432
- **Database** : agoraflux
- **Username** : postgres
- **Password** : admin

## 🛠️ Commandes utiles

```bash
# Arrêter les services Docker
docker-compose down

# Voir les logs
docker-compose logs -f postgres
docker-compose logs -f pgadmin

# Réinitialiser la base de données
docker-compose down -v  # Supprime les volumes
docker-compose up -d
python scripts/init_postgres.py
```

## 📁 Structure du projet

```
backend/
├── app/
│   ├── main.py              # Point d'entrée FastAPI
│   ├── core/                # Configuration et base de données
│   ├── models/              # Modèles SQLAlchemy
│   ├── schemas/             # Schémas Pydantic
│   ├── api/                 # Routes API
│   └── services/            # Logique métier
├── scripts/
│   └── init_postgres.py     # Script d'initialisation
├── docker-compose.yml       # Configuration Docker
└── requirements.txt         # Dépendances Python
```

## 🔧 Configuration

Les variables d'environnement sont dans le fichier `.env` :

```env
# Base de données
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin
POSTGRES_DB=agoraflux

# pgAdmin
PGADMIN_EMAIL=admin@agoraflux.fr
PGADMIN_PASSWORD=admin

# Application
DATABASE_URL=postgresql://postgres:admin@localhost:5432/agoraflux
```

## 🧪 Tests

```bash
# Lancer les tests
pytest

# Avec couverture
pytest --cov=app tests/
```

## Description

Backend API pour la plateforme de simulation et collaboration citoyenne AgoraFlux. 
Développé avec **FastAPI** et **Python 3.12**.

## Architecture

```
backend/
├── app/                    # Code source principal
│   ├── main.py            # Point d'entrée FastAPI
│   ├── core/              # Configuration et utilitaires
│   │   ├── config.py      # Variables d'environnement
│   │   └── logging.py     # Configuration logging
│   ├── api/               # Endpoints REST
│   ├── data/              # Traitement des données
│   ├── models/            # Modèles SQLAlchemy
│   ├── schemas/           # Schémas Pydantic
│   ├── services/          # Logique métier
│   └── utils/             # Utilitaires
├── tests/                 # Tests unitaires/fonctionnels
├── venv/                  # Environnement virtuel
└── requirements.txt       # Dépendances Python
```

## Installation

### 1. Environnement virtuel
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
```

### 2. Dépendances
```bash
pip install -r requirements.txt
```

### 3. Configuration
```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer les variables d'environnement
nano .env
```

## Démarrage

### Mode développement
```bash
source venv/bin/activate
python -m app.main
```

ou avec uvicorn directement :
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### URLs importantes
- **API**: http://localhost:8000/api/v1/
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Fonctionnalités

✅ **Configuration centralisée** avec Pydantic Settings  
✅ **Logging professionnel** avec Loguru  
✅ **Architecture modulaire** (data → core → api)  
✅ **Sécurité** : CORS, validation, authentification JWT  
✅ **Documentation automatique** avec FastAPI/Swagger  
✅ **Tests** unitaires et fonctionnels  

## Développement

### Tests
```bash
# Tests unitaires
pytest

# Tests avec couverture
pytest --cov=app --cov-report=html

# Tests en mode watch
pytest --watch
```

### Qualité de code
```bash
# Formatage
black app/
isort app/

# Linting
flake8 app/
mypy app/
```

## Variables d'environnement

Principales variables (voir `env.example`) :

```bash
# Base de données
DATABASE_URL=postgresql://user:pass@localhost:5432/agoraflux_db

# Sécurité
SECRET_KEY=your-secret-key
ALGORITHM=HS256

# Configuration
ENVIRONMENT=development
DEBUG=true
```

## Prochaines étapes

1. **Modèles de données** (utilisateurs, projets, datasets)
2. **Authentification JWT** 
3. **Module de traitement de données**
4. **API endpoints** pour la collaboration
5. **Tests automatisés** 