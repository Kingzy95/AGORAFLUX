# Guide des Interactions Utilisateur - AgoraFlux

## 🎯 Vue d'Ensemble

AgoraFlux propose maintenant un système complet d'interactions utilisateur pour améliorer l'engagement et la collaboration autour des données de participation citoyenne. Ces fonctionnalités permettent aux utilisateurs de filtrer, annoter, partager et exporter les visualisations de données.

## 🔧 Fonctionnalités Disponibles

### 1. Filtres Avancés 🎛️

#### Description
Système de filtrage multi-critères pour explorer les données selon différents paramètres.

#### Fonctionnalités
- **Recherche textuelle** : Recherche libre dans les projets, commentaires et datasets
- **Filtres temporels** : Sélection de périodes avec calendriers intégrés
- **Filtres par catégories** : Éducation, Transport, Logement, Santé, etc.
- **Filtres géographiques** : Par arrondissement parisien
- **Filtres par statut** : En préparation, En cours, Terminé, etc.
- **Filtres par participation** : Niveau de participation citoyenne (slider)

#### Utilisation
1. Cliquez sur le bouton flottant avec l'icône de réglages (en bas à droite)
2. Utilisez le panneau de filtres pour sélectionner vos critères
3. Les visualisations se mettent à jour automatiquement
4. Compteur de filtres actifs affiché en temps réel

#### Version Mobile
- Interface compacte avec recherche rapide
- Bouton de filtres avec badge du nombre de filtres actifs
- Drawer coulissant pour les options avancées

### 2. Système d'Annotations Collaboratives 💬

#### Description
Permet aux utilisateurs d'ajouter des commentaires contextuels directement sur les graphiques et visualisations.

#### Types d'Annotations
- **❓ Questions** : Pour poser des questions sur les données
- **💡 Observations** : Pour partager des insights
- **⚠️ Préoccupations** : Pour signaler des problèmes
- **💭 Suggestions** : Pour proposer des améliorations

#### Fonctionnalités
- **Annotations géolocalisées** : Positionnées précisément sur les graphiques
- **Annotations publiques/privées** : Contrôle de la visibilité
- **Système de permissions** : Les utilisateurs peuvent modifier leurs propres annotations
- **Réponses et threads** : Discussions contextuelles (en développement)
- **Résolution d'annotations** : Marquage comme résolu

#### Utilisation
1. Cliquez sur le bouton d'annotation (icône commentaire) sur un graphique
2. Cliquez n'importe où sur le graphique pour placer l'annotation
3. Rédigez votre commentaire et choisissez la catégorie
4. Définissez la visibilité (publique/privée)
5. Validez pour publier l'annotation

#### Gestion des Annotations
- **Visualisation** : Marqueurs colorés par catégorie
- **Détails** : Clic sur un marqueur pour voir le détail
- **Modification** : Menu contextuel pour éditer/supprimer
- **Filtrage** : Masquer/afficher toutes les annotations

### 3. Partage et Export 📤

#### Description
Système complet de partage et d'export des visualisations dans différents formats.

#### Options de Partage
- **Lien public** : Accessible à tous
- **Lien équipe** : Utilisateurs connectés uniquement  
- **Lien privé** : Accès direct par lien seulement
- **Email** : Envoi direct par messagerie
- **Message personnalisé** : Ajout de contexte

#### Formats d'Export

##### Images
- **PNG** : Haute qualité, fond transparent
- **JPEG** : Taille réduite, idéal pour le web

##### Documents
- **PDF** : Mise en page professionnelle avec métadonnées
  - Titre du graphique
  - Date de génération
  - URL de partage
  - Orientation adaptative

##### Données
- **CSV** : Format tableur pour analyse
- **JSON** : Format développeur structuré

##### Impression
- **Version papier** : Mise en page optimisée pour l'impression

#### Utilisation
1. Cliquez sur "Partager" ou "Exporter" sur un graphique
2. Choisissez le format ou le type de partage souhaité
3. Configurez les options (visibilité, message, etc.)
4. Confirmez l'action

### 4. Tableau de Bord Interactif 📊

#### Description
Interface centrale combinant toutes les fonctionnalités d'interaction dans une expérience unifiée.

#### Composants
- **Cartes de statistiques** : Métriques clés avec indicateurs de tendance
- **Graphiques annotables** : Visualisations avec système d'annotations intégré
- **Carte interactive** : Géolocalisation de la participation par arrondissement
- **Contrôles temporels** : Sélection de période d'analyse
- **Notifications** : Retours en temps réel sur les actions

#### Navigation
- **URL dédiée** : `/dashboard`
- **Menu principal** : "Tableau de bord"
- **Protection** : Authentification requise

#### Responsive Design
- **Desktop** : Interface complète avec tous les contrôles
- **Mobile** : Adaptation automatique avec drawer de filtres
- **Tablette** : Layout hybride optimisé

## 🔐 Permissions et Rôles

### Utilisateur Standard
- Créer et modifier ses propres annotations
- Voir les annotations publiques
- Filtrer et explorer les données
- Exporter les visualisations
- Partager avec liens publics

### Modérateur
- Toutes les permissions utilisateur
- Modifier toutes les annotations publiques
- Marquer les annotations comme résolues
- Accès aux annotations de leur équipe

### Administrateur
- Toutes les permissions
- Voir et modifier toutes les annotations
- Accès aux analytics d'usage
- Gestion des permissions de partage

## 🎨 Interface Utilisateur

### Design System
- **Couleurs par catégorie** : Code couleur cohérent
  - Questions : Bleu (#2196f3)
  - Observations : Vert (#4caf50)  
  - Préoccupations : Orange (#ff9800)
  - Suggestions : Violet (#9c27b0)

### Interactions
- **Hover states** : Feedback visuel sur tous les éléments interactifs
- **Loading states** : Indicateurs de chargement pour les actions longues
- **Animations** : Transitions fluides et feedback visuel
- **Shortcuts** : Raccourcis clavier pour les actions fréquentes

### Accessibilité
- **Support clavier** : Navigation complète au clavier
- **Lecteurs d'écran** : Labels et descriptions appropriés
- **Contrastes** : Respect des standards WCAG
- **Focus visible** : Indicateurs de focus clairs

## 🚀 Démarrage Rapide

### Prérequis
```bash
# Dépendances installées
npm install @mui/x-date-pickers date-fns html2canvas jspdf
```

### Accès aux Fonctionnalités
1. **Connectez-vous** à votre compte AgoraFlux
2. **Naviguez** vers "Tableau de bord" dans le menu
3. **Explorez** les données avec les filtres (bouton flottant)
4. **Ajoutez** des annotations en cliquant sur les graphiques
5. **Partagez** vos découvertes avec les boutons d'export

### Comptes de Test
```
Utilisateur standard:
- Email: user@agoraflux.com
- Mot de passe: userpass

Modérateur:
- Email: moderator@agoraflux.com  
- Mot de passe: moderatorpass

Administrateur:
- Email: admin@agoraflux.com
- Mot de passe: adminpass
```

## 📊 Données de Démonstration

### Sources
- **Budget municipal parisien 2024** : 3,97 Md€ répartis sur 6 secteurs
- **Participation par arrondissement** : 20 arrondissements avec coordonnées GPS
- **Évolution temporelle** : 7 mois de données historiques
- **Satisfaction utilisateur** : Retours d'expérience authentiques

### Données Temps Réel
Les données sont simulées pour la démonstration mais l'architecture supporte :
- Mise à jour automatique
- Synchronisation multi-utilisateurs
- Historisation des modifications
- Sauvegarde des préférences

## 🔄 Prochaines Évolutions

### Fonctionnalités en Développement
1. **Annotations collaboratives avancées**
   - Système de réponses et threads
   - Mentions d'utilisateurs (@user)
   - Notifications push

2. **Filtres intelligents**
   - Suggestions automatiques
   - Filtres prédéfinis par rôle
   - Sauvegarde de filtres personnalisés

3. **Partage social**
   - Intégration réseaux sociaux
   - Génération d'aperçus enrichis
   - Tracking des partages

4. **Analytics avancés**
   - Heatmaps d'interaction
   - Métriques d'engagement
   - Rapports d'usage

### Améliorations UX
- Mode hors ligne
- Synchronisation multi-appareils
- Thèmes personnalisables
- Raccourcis clavier avancés

## 🐛 Support et Contributions

### Signalement de Bugs
- Issues GitHub avec template standardisé
- Logs automatiques en mode développement
- Screenshots et reproductions

### Contributions
- Guidelines de contribution documentées
- Tests automatisés requis
- Review process défini

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024  
**Compatibilité** : Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ 