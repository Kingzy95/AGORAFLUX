# Schéma Global de l'Infrastructure AgoraFlux

## Architecture Générale

L'infrastructure AgoraFlux suit une **architecture en couches** moderne, séparant clairement les responsabilités entre le frontend, l'API, les services métier et la couche de données.

## Vue d'Ensemble Technique

### **Client Layer**
- **Web Browser** : Interface principale pour desktop/mobile
- **Mobile App** : Application responsive React

### **Frontend Layer** 
- **React 19 + TypeScript** : Framework principal avec typage strict
- **shadcn/ui Components** : Système de design moderne
- **Recharts Visualizations** : Graphiques interactifs
- **Leaflet Maps** : Cartographie géographique

### **API Gateway**
- **FastAPI Server** : API REST haute performance
- **CORS Middleware** : Gestion des origines multiples
- **Security Middleware** : Audit automatique des accès
- **Rate Limiting** : Protection anti-DDoS (120 req/min)

### **Backend Services**
- **Authentication Service** : JWT + Bcrypt
- **Projects Service** : Gestion des projets collaboratifs
- **Datasets Service** : Pipeline de traitement des données
- **Comments Service** : Système de discussions
- **Notifications Service** : WebSocket temps réel
- **Exports Service** : Génération de rapports
- **Data Pipeline** : Intégration APIs externes

### **Data Layer**
- **PostgreSQL Database** : Données structurées principales
- **Redis Cache** : Cache haute performance
- **File Storage** : Stockage des datasets
- **Security Logs** : Journalisation des événements

### **Security Layer**
- **JWT Tokens** : Authentification stateless
- **Password Hashing** : Bcrypt avec 12 rounds
- **Security Audit** : Traçabilité complète
- **Role-Based Access** : Permissions granulaires

### **External APIs**
- **Vélib API** : Données stations vélos
- **Budget Municipal API** : Données budgétaires
- **Open Data Paris** : Données publiques citoyennes

---

## Flux de Données

### **Entrée des Données**
1. **APIs Externes** → **Data Pipeline** → **PostgreSQL**
2. **Upload Utilisateur** → **File Storage** → **Datasets Service**
3. **Interactions Utilisateur** → **React** → **FastAPI** → **Services**

### **Sortie des Données**
1. **PostgreSQL** → **Services** → **FastAPI** → **React**
2. **Notifications** → **WebSocket** → **React** (temps réel)
3. **Exports** → **File Storage** → **Download**

### **Sécurisation des Flux**
- **Authentification** : JWT sur tous les endpoints
- **Autorisation** : Vérification des rôles par service
- **Audit** : Logging automatique des accès sensibles
- **Validation** : Pydantic schemas + TypeScript

---

## Points Clés d'Architecture

### **Forces**
- **Séparation claire** : Frontend/Backend découplés
- **Scalabilité** : Services modulaires et indépendants
- **Sécurité** : Multiple couches de protection
- **Performance** : Cache Redis + optimisations React
- **Maintenabilité** : TypeScript + Documentation complète

### **Patterns Appliqués**
- **Repository Pattern** : Séparation données/logique
- **Middleware Pattern** : Traitement transversal des requêtes
- **Observer Pattern** : Notifications temps réel
- **Strategy Pattern** : Pipeline de données configurable
- **Factory Pattern** : Création d'objets métier

### **Métriques de Performance**
- **API Response Time** : < 200ms moyenne
- **Database Queries** : Optimisées avec index
- **Bundle Size** : < 2MB (frontend)
- **Memory Usage** : < 512MB (backend)

---

## Évolution Future

### **Roadmap Technique**
1. **Microservices** : Décomposition en services indépendants
2. **GraphQL** : API unifiée pour le frontend
3. **WebAssembly** : Traitement données côté client
4. **Machine Learning** : Analyses prédictives
5. **Blockchain** : Traçabilité décentralisée

### **Sécurité Avancée**
- **Zero Trust Architecture**
- **End-to-End Encryption**
- **SIEM Integration**
- **Penetration Testing**
- **Compliance RGPD**

---

*Actuellement **79 tests backend** et **5 tests frontend** avec un taux de réussite de **100%** sur l'ensemble de la stack.* 