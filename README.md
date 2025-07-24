# 🏛️ AgoraFlux - Plateforme Collaborative Citoyenne

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/agoraflux/agoraflux)
[![Licence](https://img.shields.io/badge/licence-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.x-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-336791.svg)](https://postgresql.org/)

## 🎯 Présentation

AgoraFlux est une **plateforme de participation citoyenne moderne** qui permet aux citoyens, modérateurs et administrateurs de collaborer sur des projets municipaux à travers des données ouvertes, des visualisations interactives et des discussions structurées.

### ✨ Fonctionnalités Principales

- 🏗️ **Gestion de Projets Collaboratifs** - Création, suivi et modération de projets citoyens
- 📊 **Visualisations Avancées** - Graphiques shadcn/ui avec données temps réel
- 🗺️ **Cartographie Interactive** - Visualisation géographique par arrondissement parisien
- 💬 **Système de Commentaires** - Discussions modérées avec notifications
- 👥 **Gestion des Rôles** - Admin, Modérateur, Utilisateur avec permissions granulaires
- 🔄 **Pipeline de Données** - Traitement automatisé des données publiques
- 📈 **Analytics Communautaires** - Statistiques de participation en temps réel
- 🔔 **Notifications WebSocket** - Alertes temps réel pour la modération

---

## 🏗️ Architecture

```
AGORAFLUX/
├── 📁 backend/                    # API FastAPI + SQLAlchemy
│   ├── 📁 app/
│   │   ├── 📁 api/               # Routes REST et WebSocket
│   │   ├── 📁 core/              # Configuration et sécurité
│   │   ├── 📁 models/            # Modèles SQLAlchemy
│   │   ├── 📁 schemas/           # Validation Pydantic
│   │   ├── 📁 services/          # Logique métier
│   │   └── 📁 middleware/        # CORS, authentification
│   ├── 📁 docs/                  # Documentation API
│   ├── 📁 scripts/               # Scripts d'initialisation
│   └── 📄 requirements.txt
├── 📁 frontend/                   # React 18 + TypeScript
│   ├── 📁 src/
│   │   ├── 📁 components/        # Composants React
│   │   │   ├── 📁 ui/           # Système shadcn/ui
│   │   │   ├── 📁 analytics/    # Visualisations Recharts
│   │   │   ├── 📁 maps/         # Cartes Leaflet
│   │   │   └── 📁 comments/     # Système de discussion
│   │   ├── 📁 pages/            # Pages principales
│   │   ├── 📁 hooks/            # Hooks React personnalisés
│   │   ├── 📁 services/         # API client
│   │   ├── 📁 types/            # Types TypeScript
│   │   └── 📁 docs/             # Documentation technique
│   └── 📄 package.json
└── 📄 README.md
```

---

## 🚀 Installation et Configuration

### Prérequis

- 🐍 **Python 3.11+**
- 🟢 **Node.js 18+**
- 🐘 **PostgreSQL 15+**
- 📦 **npm ou yarn**

### 1️⃣ Cloner le Projet

```bash
git clone https://github.com/votre-org/agoraflux.git
cd AGORAFLUX
```

### 2️⃣ Configuration Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Installer les dépendances
pip install -r requirements.txt

# Configurer la base de données
cp env.example .env
# Éditer .env avec vos paramètres PostgreSQL

# Initialiser la base de données
python scripts/init_db.py
python scripts/init_test_data.py

# Lancer le serveur FastAPI
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3️⃣ Configuration Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Configurer l'API
# Créer .env.local avec :
# REACT_APP_API_URL=http://localhost:8000

# Lancer en mode développement
npm start

# Ou construire pour la production
npm run build
```

### 4️⃣ Docker (Optionnel)

```bash
cd backend
docker-compose up -d
```

---

## 👥 Système de Rôles et Permissions

### 🔴 **Administrateur** (`admin`)
- ✅ Gestion complète des utilisateurs et projets
- ✅ Accès au pipeline de données
- ✅ Modération globale des contenus
- ✅ Analytics avancées et exports
- ✅ Configuration système

### 🟡 **Modérateur** (`moderateur`)
- ✅ Modération des discussions et commentaires
- ✅ Gestion des projets communautaires
- ✅ Accès au pipeline de données (supervisé)
- ✅ Statistiques communautaires
- ❌ Gestion des utilisateurs

### 🔵 **Utilisateur** (`utilisateur`)
- ✅ Création et participation aux projets
- ✅ Commentaires et discussions
- ✅ Visualisation des données publiques
- ✅ Notifications personnalisées
- ❌ Accès aux outils d'administration

---

## 🎨 Interface Utilisateur

### 🎛️ **Tableaux de Bord**

#### **📊 Analytics et Visualisations**
- Graphiques temps réel avec **Recharts + shadcn/ui**
- Métriques de participation par arrondissement
- Évolution temporelle des projets
- Cartes interactives Paris (20 arrondissements)
- Pipeline de données avec permissions

#### **👥 Dashboard Collaboratif**
- KPI personnalisés selon le rôle
- Utilisateurs en ligne temps réel
- Statistiques de contributions
- Actions rapides contextuelles

#### **💬 Gestion des Discussions**
- Interface de modération avancée
- Actions en lot (masquer/épingler/résoudre)
- Filtrage et recherche intelligente
- Notifications automatiques

#### **🏘️ Dashboard Communautaire**
- Membres actifs et leurs contributions
- Répartition par rôles et arrondissements
- Top contributeurs avec anonymisation
- Métriques d'engagement

---

## 🔧 Fonctionnalités Techniques

### 🔄 **Pipeline de Données**
```python
# Traitement automatisé des sources
- 🚴 Données Vélib' (stations, disponibilité)
- 💰 Budget municipal par secteur
- 🏛️ Participation citoyenne par zone
- 🗺️ Géolocalisation arrondissements
- 📊 Fusion et validation automatique
```

### 🔔 **Système de Notifications WebSocket**
```typescript
// Notifications temps réel
- 📨 Nouveaux commentaires
- ⚠️ Actions de modération
- 🎯 Mentions utilisateur
- 📊 Mises à jour de données
- 🚨 Alertes administratives
```

### 🗺️ **Cartes Interactives**
```typescript
// Visualisation géographique avec Leaflet
- 📍 Marqueurs par arrondissement
- 🎨 Clusters adaptatifs
- 📊 Données superposées (participation, budget)
- 🔍 Zoom et navigation fluide
- 📱 Responsive mobile
```

### 📊 **Visualisations Avancées**
```typescript
// Graphiques modernes avec shadcn/ui + Recharts
- 📈 Courbes de participation temporelle
- 🥧 Répartitions démographiques
- 📊 Budgets municipaux par secteur
- 🎯 Métriques de satisfaction
- 🔄 Mise à jour automatique
```

---

## 🛡️ Sécurité et Modération

### 🔒 **Authentification**
- JWT avec refresh tokens
- Sessions sécurisées
- Protection CORS

### 🛡️ **Modération Avancée**
```typescript
// Système complet de modération
- 🚫 Masquage de commentaires
- 📌 Épinglage de discussions importantes
- ✅ Résolution de problématiques
- 🗑️ Suppression définitive (admin)
- 📧 Notifications automatiques aux utilisateurs
```

### 📊 **Audit et Traçabilité**
- Logs détaillés des actions
- Historique des modifications
- Traçabilité des décisions de modération
- Métriques de performance

---

## 🧪 Tests et Qualité

### 🔬 **Tests Automatisés**
```bash
# Backend
pytest app/tests/ -v --coverage

# Frontend  
npm test
npm run test:e2e
```

### 📊 **Métriques de Qualité**
- Coverage > 80%
- ESLint + Prettier (Frontend)
- Black + isort (Backend)
- TypeScript strict mode

---

## 📚 Documentation

### 📖 **Documentation Technique**
- [`PIPELINE_PERMISSIONS.md`](frontend/src/docs/PIPELINE_PERMISSIONS.md) - Permissions du pipeline
- [`MODERATION_SYSTEM.md`](frontend/src/docs/MODERATION_SYSTEM_IMPLEMENTED.md) - Système de modération
- [`ROLE_PERMISSIONS_GUIDE.md`](frontend/src/docs/ROLE_PERMISSIONS_GUIDE.md) - Guide des rôles
- [`DATABASE_DESIGN.md`](backend/docs/DATABASE_DESIGN.md) - Architecture base de données

### 🛠️ **API Documentation**
- **Swagger UI** : `http://localhost:8000/docs`
- **ReDoc** : `http://localhost:8000/redoc`
- **OpenAPI JSON** : `http://localhost:8000/openapi.json`


---

## 🤝 Contribution

### 🔄 **Workflow de Développement**
```bash
# 1. Fork le projet
git clone https://github.com/votre-username/agoraflux.git

# 2. Créer une branche feature
git checkout -b feature/nouvelle-fonctionnalite

# 3. Développer et tester
npm test
pytest

# 4. Commit avec conventional commits
git commit -m "feat: ajout système de notifications"

# 5. Push et Pull Request
git push origin feature/nouvelle-fonctionnalite
```

### 📝 **Conventions**
- **Commits** : [Conventional Commits](https://conventionalcommits.org/)
- **Code** : ESLint + Prettier (JS/TS), Black + isort (Python)
- **Documentation** : Markdown avec exemples de code
- **Tests** : Coverage minimum 80%



---

## 📊 Statistiques du Projet

| Métrique | Valeur |
|----------|--------|
| 🏗️ **Composants React** | 50+ |
| 🛣️ **Routes API** | 40+ |
| 📊 **Types TypeScript** | 100+ |
| 🧪 **Tests** | 200+ |
| 📝 **Documentation** | 15+ pages |
| 🎨 **Composants UI** | shadcn/ui complet |

---

## 📜 Licence

```
MIT License

Copyright (c) 2024 AgoraFlux

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**🏛️ Fait avec ❤️ pour la démocratie participative**

[![GitHub stars](https://img.shields.io/github/stars/agoraflux/agoraflux?style=social)](https://github.com/agoraflux/agoraflux/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/agoraflux/agoraflux?style=social)](https://github.com/agoraflux/agoraflux/network/members)

[🌐 Site Web](https://agoraflux.fr) • [📖 Documentation](https://docs.agoraflux.fr) • [💬 Discord](https://discord.gg/agoraflux)

</div> 