# Guide des Permissions par Rôle - Tableau de Bord Collaboratif

## 🎯 Vue d'ensemble

Le tableau de bord collaboratif d'AgoraFlux adapte son interface selon le **rôle de l'utilisateur connecté**, offrant une expérience personnalisée et des fonctionnalités appropriées à chaque niveau de responsabilité.

## 👥 Rôles et Permissions

### 🔴 **Administrateur (`admin`)**

**Objectif** : Vue complète de la plateforme avec contrôles administratifs

#### 📊 KPI Affichés
- ✅ **Discussions Actives** : Toutes les discussions en cours
- ✅ **Discussions Résolues** : Historique complet des résolutions
- ✅ **Total Réponses** : Engagement global de la communauté
- ✅ **Utilisateurs En Ligne** : Monitoring temps réel

#### 📈 Métriques Spéciales
- **Analytics Avancées** : Graphiques détaillés sur 7 jours
- **Top 10 Contributeurs** : Liste étendue avec rôles détaillés
- **Statistiques de Modération** : Commentaires signalés/supprimés
- **Taux de Participation Global** : Basé sur tous les utilisateurs

#### 🛠️ Actions Disponibles
- ✅ Nouvelle Discussion
- ✅ Modérer Discussions
- ✅ **Gestion Utilisateurs** (Admin uniquement)
- ✅ **Analytics Avancées** (Admin uniquement)
- ✅ Actualiser Données

#### 🎨 Interface
- **Couleur** : Rouge (sécurité/administration)
- **Icône** : `security` - Accent sur le contrôle
- **Données** : Complètes et non filtrées

---

### 🟡 **Modérateur (`moderateur`)**

**Objectif** : Gestion communautaire et modération

#### 📊 KPI Affichés
- ✅ **Discussions Actives** : Discussions nécessitant attention
- ✅ **Discussions Résolues** : Historique de modération
- ✅ **Total Réponses** : Engagement communautaire
- ✅ **Utilisateurs En Ligne** : Monitoring communauté

#### 📈 Métriques Spéciales
- **Insights Modération** : Focus sur les discussions à modérer
- **Top 7 Contributeurs** : Contributeurs actifs (sans données sensibles)
- **Graphiques 6 jours** : Tendances de modération
- **Taux de Participation Modéré** : Basé sur utilisateurs actifs

#### 🛠️ Actions Disponibles
- ✅ Nouvelle Discussion
- ✅ **Modérer Discussions** (Modérateur/Admin)
- ✅ Actualiser Données

#### 🎨 Interface
- **Couleur** : Jaune (attention/modération)
- **Icône** : `shield` - Protection de la communauté
- **Données** : Filtrées pour la modération

---

### 🔵 **Utilisateur (`utilisateur`)**

**Objectif** : Participation collaborative personnalisée

#### 📊 KPI Affichés
- ✅ **Discussions Actives** : Vue communautaire générale
- ❌ ~~Discussions Résolues~~ (non pertinent)
- ✅ **Total Réponses** : Ses propres contributions
- ❌ ~~Utilisateurs En Ligne~~ (vie privée)
- ✅ **Mes Contributions** (KPI personnel)

#### 📈 Métriques Spéciales
- **Mon Engagement** : Focus sur ses propres statistiques
- **Top 3 Contributeurs** : Vue anonymisée de la communauté
- **Graphiques 5 jours** : Son activité personnelle
- **Taux de Participation Personnel** : Sa contribution relative

#### 🛠️ Actions Disponibles
- ✅ Nouvelle Discussion
- ✅ **Mes Contributions** (Utilisateur uniquement)
- ✅ Actualiser Données

#### 🎨 Interface
- **Couleur** : Bleu (collaboration/communauté)
- **Icône** : `info` - Information et participation
- **Données** : Personnalisées et anonymisées

---

## 🔐 Sécurité et Confidentialité

### Principe de Moindre Privilège
- **Utilisateurs** : Voient uniquement leurs données + vue anonymisée communauté
- **Modérateurs** : Accès aux outils de modération + données communautaires
- **Admins** : Accès complet + outils d'administration

### Protection des Données
- **Utilisateurs en ligne** : Visible seulement aux modérateurs/admins
- **Statistiques détaillées** : Réservées aux rôles de gestion
- **Données personnelles** : Anonymisées pour les utilisateurs standards

### Audit et Traçabilité
- Toutes les actions sont logguées selon le rôle
- Accès aux fonctionnalités tracé pour conformité
- Permissions vérifiées côté backend ET frontend

---

## 🛠️ Implémentation Technique

### Frontend (`CollaborativeDashboard.tsx`)
```typescript
// Détection du rôle
const isAdmin = user?.role === 'admin';
const isModerator = user?.role === 'moderateur' || isAdmin;
const isUser = user?.role === 'utilisateur';

// Affichage conditionnel
{isModerator && (
  <KPIComponent />
)}
```

### Backend (`collaboration.py`)
```python
# Endpoint adaptatif
@router.get("/stats/role-based")
async def get_role_based_stats(current_user: User):
    if current_user.role.value == 'admin':
        # Données complètes
    elif current_user.role.value == 'moderateur':
        # Données de modération
    else:
        # Données personnelles
```

---

## 📋 Checklist d'Implémentation

### ✅ Fonctionnalités Implémentées
- [x] Détection automatique du rôle utilisateur
- [x] Affichage conditionnel des KPI selon le rôle
- [x] Actions personnalisées par rôle
- [x] Interface visuelle différenciée
- [x] Messages d'information contextuels
- [x] Endpoint backend adaptatif (`/stats/role-based`)
- [x] Protection des données sensibles

### 🔄 Extensions Possibles
- [ ] Permissions granulaires par projet
- [ ] Rôles temporaires avec expiration
- [ ] Délégation de permissions modérateur
- [ ] Analytics de l'utilisation par rôle
- [ ] Notifications spécifiques au rôle

---

## 🎯 Exemple d'Utilisation

Un **utilisateur standard** se connecte et voit :
- Ses 3 dernières contributions
- Un graphique de son activité personnelle
- Les discussions générales (anonymisées)
- Une action "Mes Contributions"

Un **modérateur** se connecte et voit :
- 5 utilisateurs en ligne avec leurs rôles
- Les discussions nécessitant modération
- Un bouton "Modérer Discussions"
- Des graphiques d'activité communautaire

Un **admin** se connecte et voit :
- 10 utilisateurs en ligne avec détails complets
- Toutes les statistiques de la plateforme
- Boutons "Gestion Utilisateurs" et "Analytics Avancées"
- Graphiques détaillés sur 7 jours

Cette approche assure une **expérience utilisateur optimale** tout en respectant les **principes de sécurité** et de **confidentialité**. 