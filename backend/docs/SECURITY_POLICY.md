# Politique de Sécurité & Confidentialité - AgoraFlux

## 🔐 Authentification et Rôles

### Rôles Utilisateur

AgoraFlux utilise un système de rôles à 3 niveaux :

#### 1. **Administrateur** (`admin`)
- **Accès complet** à toutes les fonctionnalités de la plateforme
- **Gestion des utilisateurs** : création, modification, suppression de comptes
- **Gestion globale des projets** : accès et modification de tous les projets
- **Configuration système** : paramètres de sécurité, maintenance
- **Audit et supervision** : accès aux journaux de sécurité

#### 2. **Modérateur** (`moderateur`)
- **Modération des contenus** : commentaires, projets, datasets
- **Gestion des utilisateurs limitée** : suspension temporaire
- **Accès aux projets publics et restreints**
- **Génération de rapports** de modération

#### 3. **Utilisateur** (`utilisateur`)
- **Création et gestion** de ses propres projets
- **Participation** aux projets publics (commentaires, contributions)
- **Upload et gestion** de ses datasets
- **Accès aux fonctionnalités de collaboration**

## 🛡️ Politique des Mots de Passe

### Exigences Minimales

Tous les mots de passe doivent respecter les critères suivants :

- **Longueur minimale** : 8 caractères
- **Composition requise** :
  - Au moins 1 lettre minuscule (a-z)
  - Au moins 1 lettre majuscule (A-Z)
  - Au moins 1 chiffre (0-9)
  - Au moins 1 caractère spécial (!@#$%^&*()_+-=[]{}|;:,.<>?)

### Bonnes Pratiques Recommandées

- **Longueur optimale** : 12 caractères ou plus
- **Unicité** : Ne pas réutiliser les mots de passe d'autres services
- **Renouvellement** : Changer le mot de passe tous les 6 mois
- **Stockage sécurisé** : Utiliser un gestionnaire de mots de passe

### Interdictions

- Mots de passe basés sur des informations personnelles
- Suites de caractères simples (123456, abcdef, azerty)
- Mots du dictionnaire sans modifications
- Réutilisation des 5 derniers mots de passe

## 🔒 Sécurité des Comptes

### Protection Anti-Bruteforce

- **Limitation des tentatives** : Maximum 5 tentatives de connexion échouées
- **Verrouillage temporaire** : 15 minutes après dépassement du seuil
- **Surveillance IP** : Détection des tentatives massives par adresse IP
- **Alerte automatique** : Notification en cas d'activité suspecte

### Sessions et Tokens

- **Durée des sessions** : 30 minutes d'inactivité
- **Tokens JWT** : Renouvellement automatique
- **Déconnexion automatique** : Après expiration ou inactivité prolongée
- **Session unique** : Possibilité de limiter à une session par utilisateur

## 📊 Journalisation et Audit

### Événements Journalisés

**Authentification :**
- Connexions réussies et échouées
- Changements de mot de passe
- Verrouillages et déverrouillages de compte
- Déconnexions

**Accès Sensibles :**
- Accès aux fonctions d'administration
- Actions de modération
- Modifications de permissions
- Exports de données

**Actions Critiques :**
- Création/suppression de projets
- Invitation/retrait d'utilisateurs
- Modifications de rôles
- Tentatives d'accès non autorisées

### Conservation des Logs

- **Durée de conservation** : 12 mois minimum
- **Accès restreint** : Administrateurs uniquement
- **Intégrité** : Protection contre la modification
- **Anonymisation** : Après la période de conservation

## 🔐 Permissions par Projet

### Système Granulaire

Chaque projet peut avoir des permissions spécifiques :

**Rôle Admin de Projet :**
- Gestion complète du projet
- Invitation/retrait d'utilisateurs
- Modification des permissions
- Suppression du projet

**Rôle Modérateur de Projet :**
- Modération des commentaires
- Gestion des datasets
- Export des données
- Pas de gestion des utilisateurs

**Rôle Utilisateur de Projet :**
- Lecture du contenu
- Ajout de commentaires
- Upload de datasets
- Participation aux discussions

### Héritage des Rôles Globaux

- **Admins globaux** → Admins automatiques sur tous les projets
- **Modérateurs globaux** → Modérateurs automatiques sur projets publics
- **Utilisateurs** → Accès selon les permissions projet

## 🚨 Détection d'Intrusion

### Surveillance Automatique

- **Tentatives de connexion anormales**
- **Accès depuis nouvelles localisations géographiques**
- **Patterns d'utilisation suspects**
- **Tentatives d'élévation de privilèges**

### Réactions Automatiques

- **Verrouillage préventif** des comptes à risque
- **Limitation de bande passante** pour les IP suspectes
- **Alertes en temps réel** aux administrateurs
- **Blocage temporaire** des actions sensibles

## 📋 Conditions d'Usage

### Utilisation Acceptable

**Autorisé :**
- Collaboration citoyenne constructive
- Partage de données publiques
- Discussions respectueuses
- Utilisation des fonctionnalités prévues

**Interdit :**
- Tentatives d'intrusion ou de piratage
- Partage de données confidentielles sans autorisation
- Usurpation d'identité
- Spamming ou trolling
- Utilisation à des fins commerciales non autorisées

### Sanctions

**Première infraction :**
- Avertissement et sensibilisation
- Suppression du contenu inapproprié

**Infractions répétées :**
- Suspension temporaire (7-30 jours)
- Limitation des fonctionnalités

**Infractions graves :**
- Suspension définitive
- Signalement aux autorités si nécessaire

## 🛠️ Maintenance et Mises à Jour

### Mises à Jour de Sécurité

- **Déploiement automatique** des correctifs critiques
- **Fenêtres de maintenance** planifiées et annoncées
- **Tests de sécurité** réguliers
- **Audit de code** par des tiers

### Communication

- **Notifications préalables** pour les maintenances planifiées
- **Alertes de sécurité** en cas d'incident
- **Changelog public** des améliorations de sécurité
- **Canal de contact** pour signaler des vulnérabilités

## 📞 Contact et Signalement

### Équipe Sécurité

- **Email** : security@agoraflux.fr
- **Urgences** : +33 (0)1 XX XX XX XX
- **Bug Bounty** : Récompenses pour la découverte de vulnérabilités

### Signalement d'Incident

En cas de suspicion d'incident de sécurité :

1. **Documenter** l'incident (captures d'écran, logs)
2. **Signaler immédiatement** à l'équipe sécurité
3. **Ne pas tenter** de reproduire ou exploiter
4. **Coopérer** avec l'enquête si nécessaire

---

*Cette politique est mise à jour régulièrement. Dernière révision : Janvier 2025* 