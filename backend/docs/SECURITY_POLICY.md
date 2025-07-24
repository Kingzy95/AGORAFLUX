# Politique de Sécurité & Confidentialité - AgoraFlux

## Authentification et Rôles

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

## Politique des Mots de Passe

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
- Séquences simples (123456, abcdef, qwerty)
- Mots du dictionnaire sans modification
- Réutilisation des 5 derniers mots de passe

## Sécurité des Comptes

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

## Journalisation et Audit

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

## Permissions par Projet

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

Les rôles globaux héritent automatiquement des permissions :
- **Admin global** → Admin sur tous les projets
- **Modérateur global** → Modérateur sur tous les projets publics
- **Utilisateur** → Permissions explicites requises

## Protection des Données

### Chiffrement

- **En transit** : HTTPS/TLS 1.3 pour toutes les communications
- **Au repos** : Chiffrement AES-256 pour les données sensibles
- **Mots de passe** : Hachage bcrypt avec 12 rounds minimum
- **Tokens** : Signature cryptographique pour l'intégrité

### Anonymisation

- **Données personnelles** : Anonymisation automatique après suppression
- **Logs d'audit** : Pseudonymisation des identifiants utilisateur
- **Exports** : Option d'anonymisation pour les rapports publics
- **Statistiques** : Agrégation sans données personnelles identifiables

### Sauvegarde et Récupération

- **Backup quotidien** : Sauvegarde chiffrée automatique
- **Rétention** : 30 jours pour les sauvegardes complètes
- **Test de récupération** : Validation mensuelle des procédures
- **Site distant** : Stockage géographiquement séparé

## Politique de Confidentialité

### Collecte de Données

**Données obligatoires :**
- Email (identifiant unique)
- Nom et prénom
- Mot de passe (haché)

**Données optionnelles :**
- Photo de profil
- Biographie
- Localisation (ville)
- Site web personnel

### Utilisation des Données

Les données collectées sont utilisées exclusivement pour :
- **Authentification** et gestion des comptes
- **Personnalisation** de l'expérience utilisateur
- **Collaboration** sur les projets
- **Communication** relative au service
- **Amélioration** de la plateforme

### Droits des Utilisateurs

Conformément au RGPD, chaque utilisateur dispose de :
- **Droit d'accès** : Consultation de ses données personnelles
- **Droit de rectification** : Modification des informations
- **Droit à l'effacement** : Suppression du compte et des données
- **Droit à la portabilité** : Export de ses données au format JSON
- **Droit d'opposition** : Refus du traitement pour certaines finalités

## Signalement d'Incidents

### Procédure de Signalement

En cas de problème de sécurité :

1. **Signalement immédiat** : Contacter l'équipe de sécurité
2. **Email sécurisé** : security@agoraflux.fr
3. **Numéro d'urgence** : +33 (0)1 23 45 67 89
4. **Formulaire en ligne** : Interface de signalement dédiée

### Types d'Incidents à Signaler

- Tentatives d'accès non autorisé
- Vulnérabilités de sécurité découvertes
- Utilisation abusive de la plateforme
- Données personnelles compromises
- Comportements suspects

### Temps de Réponse

- **Critique** : < 2 heures
- **Élevé** : < 24 heures
- **Moyen** : < 72 heures
- **Faible** : < 1 semaine

## Conformité Réglementaire

### RGPD (Règlement Général sur la Protection des Données)

AgoraFlux est conçu pour être conforme au RGPD :
- **Privacy by Design** : Protection intégrée dès la conception
- **Consentement explicite** : Opt-in pour les données non essentielles
- **DPO désigné** : Délégué à la protection des données identifié
- **Registre des traitements** : Documentation complète maintenue

### Autres Réglementations

- **LIL (Loi Informatique et Libertés)** : Conformité française
- **eIDAS** : Identification électronique européenne
- **Cybersécurité** : Respect des recommandations ANSSI

## Contact

### Équipe Sécurité

- **Email** : security@agoraflux.fr
- **PGP Key** : [Clé publique disponible]
- **Signal** : +33 (0)1 23 45 67 89

### Délégué à la Protection des Données (DPO)

- **Email** : dpo@agoraflux.fr
- **Courrier** : AgoraFlux DPO, [Adresse postale]
- **Téléphone** : +33 (0)1 23 45 67 90

---

*Cette politique est mise à jour régulièrement. Dernière révision : Janvier 2025*
*Version : 2.0.0* 