# AgoraFlux

## Présentation

AgoraFlux est une plateforme de simulation et de collaboration citoyenne en ligne, destinée à proposer, visualiser et débattre autour de données publiques enrichies. Elle mêle interactivité, expressivité graphique, modélisation fonctionnelle et modularité.

## Objectifs

1. Proposer un espace participatif de discussion structuré autour de données publiques
2. Structurer les flux de traitement de données de manière modulaire et optimisée  
3. Fournir une couche de visualisation expressive et dynamique
4. Intégrer des scénarios utilisateurs personnalisés
5. Assurer sécurité, confidentialité et accessibilité de la plateforme
6. Rendre possible une contribution citoyenne augmentée par la donnée
7. Déployer un socle de tests robuste

## Architecture

```
agoraflux/
├── backend/           # API et logique métier
│   ├── data/         # Module de traitement des données
│   ├── core/         # Logique métier centrale
│   └── api/          # Routes et contrôleurs
├── frontend/         # Interface utilisateur
├── shared/           # Code partagé (types, utilitaires)
├── tests/           # Tests unitaires et fonctionnels
├── docs/            # Documentation
└── data/            # Sources de données
```

## Installation

```bash
# Cloner le projet
git clone <repo-url>
cd AGORAFLUX

# Installer les dépendances backend
cd backend
npm install

# Installer les dépendances frontend  
cd ../frontend
npm install

# Lancer en mode développement
npm run dev
```

## Technologies

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Vite
- **Base de données**: PostgreSQL
- **Visualisations**: D3.js + Chart.js
- **Tests**: Jest + Cypress
- **Documentation**: Markdown + JSDoc

## Contribuer

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour les guidelines de développement.

## Licence

MIT License - Voir [LICENSE](./LICENSE) pour plus de détails. 