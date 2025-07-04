# AgoraFlux Frontend

## Vue d'ensemble

AgoraFlux est une plateforme de simulation et collaboration citoyenne qui permet aux citoyens de participer activement aux décisions municipales. Cette application React offre une interface moderne et intuitive pour visualiser les données publiques, participer aux discussions et suivre l'évolution des projets.

## 🚀 Technologies Utilisées

- **React 19** avec TypeScript
- **Material-UI v7** pour l'interface utilisateur
- **React Router** pour la navigation
- **TanStack Query** pour la gestion des données
- **Axios** pour les appels API
- **JWT** pour l'authentification

## 📁 Structure du Projet

```
src/
├── components/          # Composants réutilisables
│   ├── Layout.tsx      # Layout principal avec navigation
│   └── ProtectedRoute.tsx # Protection des routes
├── context/            # Contextes React
│   └── AuthContext.tsx # Gestion de l'authentification
├── pages/              # Pages de l'application
│   ├── Home.tsx        # Page d'accueil
│   ├── Login.tsx       # Page de connexion
│   └── Projects.tsx    # Liste des projets
├── services/           # Services API
│   └── api.ts          # Client API avec intercepteurs
├── types/              # Définitions TypeScript
│   ├── auth.ts         # Types d'authentification
│   └── project.ts      # Types des projets
└── App.tsx             # Composant principal avec routing
```

## 🎨 Fonctionnalités Implémentées

### ✅ Interface Utilisateur de Base
- **Design responsive** compatible mobile/desktop
- **Navigation intuitive** avec menu adaptatif
- **Thème Material Design** personnalisé pour AgoraFlux
- **Accessibilité** conforme aux standards WCAG

### ✅ Authentification et Autorisation
- **Connexion sécurisée** avec JWT
- **Protection des routes** basée sur les rôles
- **Gestion automatique** des tokens (refresh)
- **Interface de connexion** élégante et accessible

### ✅ Pages Principales
- **Page d'accueil** : Présentation d'AgoraFlux et projets en vedette
- **Page projets** : Liste avec recherche et filtres
- **Page de connexion** : Formulaire sécurisé avec validation

### ✅ Système de Navigation
- **Menu responsive** avec drawer mobile
- **Navigation contextuelle** selon l'authentification
- **Breadcrumbs** et indicateurs visuels
- **Liens d'administration** pour les admins

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env` avec :

```env
REACT_APP_API_URL=http://127.0.0.1:8000/api/v1
REACT_APP_APP_NAME=AgoraFlux
REACT_APP_VERSION=1.0.0
```

### Installation et Démarrage

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm start

# Build de production
npm run build

# Tests
npm test
```

## 🔐 Authentification

L'application utilise un système d'authentification JWT complet :

- **Tokens sécurisés** avec expiration automatique
- **Rafraîchissement automatique** des tokens
- **Gestion des rôles** (admin, modérateur, utilisateur)
- **Protection CORS** et validation côté client

### Comptes de Test

- **Admin** : admin@agoraflux.fr / admin123
- **Utilisateur** : utilisateur@agoraflux.fr / user123

## 📱 Interface Responsive

L'application s'adapte automatiquement à tous les écrans :

- **Mobile** (< 768px) : Navigation par drawer, layout vertical
- **Tablette** (768px - 1024px) : Interface hybride
- **Desktop** (> 1024px) : Navigation horizontale, multi-colonnes

## 🎯 Routes Implémentées

### Routes Publiques
- `/` - Page d'accueil
- `/projects` - Liste des projets
- `/projects/:id` - Détail d'un projet
- `/login` - Connexion
- `/register` - Inscription

### Routes Protégées
- `/dashboard` - Tableau de bord utilisateur
- `/projects/new` - Création de projet
- `/profile` - Profil utilisateur
- `/settings` - Paramètres

### Routes Administrateur
- `/admin` - Panneau d'administration
- `/admin/users` - Gestion des utilisateurs

## 🛡️ Sécurité

- **Protection XSS** via les props React
- **Validation TypeScript** stricte
- **Gestion sécurisée** des tokens JWT
- **Routes protégées** avec vérification des rôles
- **Nettoyage automatique** des tokens expirés

## 🔄 Intégration API

Le frontend communique avec l'API backend via :

- **Client Axios** configuré avec intercepteurs
- **Gestion automatique** des headers d'authentification
- **Retry automatique** en cas d'expiration de token
- **Gestion d'erreurs** centralisée

## 🎨 Design System

Basé sur Material-UI avec personnalisations AgoraFlux :

- **Palette de couleurs** : Bleu/Violet institutional
- **Typographie** : Roboto avec hiérarchie claire
- **Espacement** : Système de grille cohérent
- **Composants** : Boutons, cartes, formulaires standardisés

## 📈 Performance

- **Build optimisé** avec code splitting
- **Lazy loading** des composants
- **Cache intelligent** avec TanStack Query
- **Bundle analysis** disponible

## 🧪 Tests

Structure de test en place pour :

- **Tests unitaires** des composants
- **Tests d'intégration** des pages
- **Tests d'accessibilité**
- **Tests e2e** (à implémenter)

## 🚀 Déploiement

L'application est prête pour le déploiement en production :

```bash
npm run build
serve -s build
```

Compatible avec :
- **Netlify** / **Vercel** (déploiement statique)
- **Nginx** / **Apache** (serveur traditionnel)
- **Docker** (containerisation)

## 📝 Prochaines Étapes

1. **Implémentation complète** des pages manquantes
2. **Visualisations interactives** avec D3.js/Recharts
3. **Système de commentaires** en temps réel
4. **Upload de fichiers** avec progress
5. **Tests automatisés** complets

---

*AgoraFlux Frontend v1.0.0 - Plateforme de Collaboration Citoyenne*
