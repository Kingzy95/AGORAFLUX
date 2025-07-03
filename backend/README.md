# AgoraFlux Backend

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