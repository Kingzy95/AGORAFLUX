# Design de la Base de Données AgoraFlux

## Vue d'ensemble

La base de données AgoraFlux est conçue pour supporter une plateforme de **collaboration citoyenne** autour de données publiques. Elle implémente une architecture modulaire avec quatre entités principales interconnectées.

## Modèles de Données

### 🧑‍💼 User (Utilisateurs)

Gestion des utilisateurs avec système de rôles hiérarchique :

**Rôles disponibles :**
- `ADMIN` : Administration complète de la plateforme
- `MODERATOR` : Modération des contenus et utilisateurs
- `USER` : Utilisateur standard (citoyen)

**Fonctionnalités clés :**
- Authentification sécurisée avec hachage bcrypt
- Système de verrouillage anti-bruteforce
- Profils utilisateur enrichis (bio, localisation, site web)
- Suivi des connexions et activités

### 📁 Project (Projets)

Projets de collaboration citoyenne autour de données publiques :

**Statuts de projet :**
- `DRAFT` : Projet en cours de préparation
- `ACTIVE` : Projet ouvert à la collaboration
- `COMPLETED` : Projet terminé
- `ARCHIVED` : Projet archivé
- `SUSPENDED` : Projet suspendu

**Fonctionnalités :**
- Gestion de la visibilité (public/privé/restreint)
- Système de tags pour la catégorisation
- Méthodologie et objectifs documentés
- Statistiques de participation (vues, contributeurs)

### 📊 Dataset (Jeux de données)

Gestion des données publiques avec pipeline de traitement :

**Types supportés :**
- `CSV` : Fichiers délimités
- `JSON` : Données structurées
- `API` : Connexions à des APIs externes
- `EXCEL` : Fichiers Excel

**Pipeline de qualité :**
- **Complétude** : Pourcentage de données remplies
- **Cohérence** : Cohérence des formats et types
- **Validité** : Respect des règles de validation
- Évaluation automatique de la qualité globale

### 💬 Comment (Commentaires)

Système de collaboration asynchrone avec modération :

**Types de commentaires :**
- `COMMENT` : Commentaire standard
- `SUGGESTION` : Suggestion d'amélioration
- `QUESTION` : Question posée
- `ANNOTATION` : Annotation sur un élément spécifique

**Fonctionnalités :**
- Threads de discussion (commentaires imbriqués)
- Système de likes et signalements
- Modération avec workflow d'approbation
- Annotations contextuelles

## Relations entre Entités

```
User (1) ----< Project (1) ----< Dataset
  |                |                |
  |                |                |
  +-------< Comment <--------------+
          (auteur)    (projet)   (dataset)
```

### Relations principales :

1. **User → Project** : Un utilisateur peut créer plusieurs projets
2. **Project → Dataset** : Un projet peut contenir plusieurs datasets
3. **User → Dataset** : Traçabilité de qui a uploadé chaque dataset
4. **User → Comment** : Chaque commentaire a un auteur
5. **Project → Comment** : Les commentaires sont liés aux projets
6. **Comment → Comment** : Support des réponses (threads)

## Configuration Base de Données

### Environnement de développement
- **SQLite** : `sqlite:///./agoraflux.db`
- Configuration automatique via script d'initialisation
- Données de test intégrées

### Environnement de production
- **PostgreSQL** recommandé
- Pool de connexions configuré (10 connexions, max 20)
- Support des transactions ACID

## Script d'Initialisation

Le script `scripts/init_db.py` crée :

### Utilisateurs de test :
- **Admin** : `admin@agoraflux.fr` / `admin123`
- **Modérateur** : `moderateur@agoraflux.fr` / `mod123`
- **Citoyens** : `citoyen@agoraflux.fr` / `user123`

### Données démonstration :
- 1 projet "Budget Municipal Paris 2024"
- 1 dataset avec scores de qualité (98.1% global)
- 4 commentaires avec thread de discussion

## Validation des Données

### Schémas Pydantic

Chaque modèle dispose de schémas de validation complets :

- **Création** : Validation stricte des nouvelles entités
- **Mise à jour** : Validation partielle pour les modifications
- **Lecture** : Sérialisation sécurisée pour l'API
- **Administration** : Vues étendues pour les administrateurs

### Règles de validation :

**Utilisateurs :**
- Email valide requis
- Nom d'utilisateur alphanumérique (3-50 caractères)
- Mot de passe fort (8+ caractères, majuscule, minuscule, chiffre)

**Projets :**
- Titre descriptif (5-255 caractères)  
- Description substantielle (20+ caractères)
- Maximum 10 tags par projet

**Datasets :**
- Nom explicite obligatoire
- URL source validée si fournie
- Formats d'export configurables

**Commentaires :**
- Contenu non vide obligatoire
- Support des annotations contextuelles
- Validation du type selon le contexte

## Sécurité et Performance

### Sécurité :
- Hachage bcrypt pour les mots de passe
- Protection contre le bruteforce (verrouillage temporaire)
- Validation stricte des entrées utilisateur
- Relations avec clés étrangères pour l'intégrité

### Performance :
- Index sur les champs de recherche fréquents
- Pagination intégrée pour les listes
- Pool de connexions optimisé
- Relations lazy-loading configurables

## Migration et Évolution

La structure est conçue pour évoluer facilement :
- Ajout de nouveaux types de datasets
- Extension du système de rôles
- Nouvelles fonctionnalités de collaboration
- Intégration de systèmes de visualisation

## Utilisation

```bash
# Initialisation de la base de données
cd backend
source venv/bin/activate
python scripts/init_db.py

# Test des modèles
python -c "from app.models import User, Project; print('✅ Modèles OK')"

# Test des schémas
python -c "from app.schemas import UserCreate; print('✅ Schémas OK')"
```

Cette architecture respecte les principes du cahier des charges AgoraFlux en offrant une base solide pour la collaboration citoyenne autour de données publiques enrichies. 